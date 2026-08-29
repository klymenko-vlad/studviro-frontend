import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { proxy } from './proxy';

function request(
  path: string,
  options: {
    cookies?: Record<string, string>;
    acceptLanguage?: string;
    nonceHeader?: string;
  } = {},
): NextRequest {
  const headers = new Headers();
  if (options.acceptLanguage) headers.set('accept-language', options.acceptLanguage);
  if (options.nonceHeader) headers.set('x-nonce', options.nonceHeader);

  const cookiePairs = Object.entries(options.cookies ?? {});
  if (cookiePairs.length > 0) {
    headers.set(
      'cookie',
      cookiePairs.map(([key, value]) => `${key}=${value}`).join('; '),
    );
  }

  return new NextRequest(new URL(path, 'http://localhost:3001'), { headers });
}

/**
 * The nonce is handed to the render on a *request* header, which `NextResponse`
 * carries as `x-middleware-request-<name>`. Next unpacks it before the layout
 * runs; asserting on it here is the only way to see what the render will read.
 */
function forwardedNonce(response: ReturnType<typeof proxy>): string | null {
  return response.headers.get('x-middleware-request-x-nonce');
}

function policyNonce(response: ReturnType<typeof proxy>): string | undefined {
  return /'nonce-([A-Za-z0-9+/=]+)'/.exec(
    response.headers.get('content-security-policy') ?? '',
  )?.[1];
}

describe('security headers', () => {
  it('sets a CSP on every matched request', () => {
    const response = proxy(request('/'));

    expect(response.headers.get('content-security-policy')).toContain(
      `default-src 'self'`,
    );
  });

  it('hands the render the same nonce it put in the policy', () => {
    const response = proxy(request('/'));

    expect(forwardedNonce(response)).toBe(policyNonce(response));
    expect(policyNonce(response)).toBeTruthy();
  });

  it('overwrites a client-supplied nonce header', () => {
    const response = proxy(request('/', { nonceHeader: 'attacker-chosen' }));

    // Trusting an inbound `x-nonce` would let a caller pick the one value the
    // policy allows an inline script to carry.
    expect(forwardedNonce(response)).not.toBe('attacker-chosen');
    expect(forwardedNonce(response)).toBe(policyNonce(response));
  });

  // `Vary: Cookie, Accept-Language` is deliberately *not* set here — Next
  // overwrites the header for App Router responses after middleware runs. It
  // lives in `next.config.ts` instead, and `e2e/locale.spec.ts` asserts it on a
  // real response.
});

describe('locale cookie', () => {
  it('pins the negotiated locale on a first visit', () => {
    const response = proxy(request('/', { acceptLanguage: 'uk-UA,uk;q=0.9' }));

    expect(response.cookies.get('NEXT_LOCALE')?.value).toBe('uk');
  });

  it('leaves an existing choice alone', () => {
    const response = proxy(
      request('/', { cookies: { NEXT_LOCALE: 'uk' }, acceptLanguage: 'en-GB' }),
    );

    // Overwriting here would undo the switcher on the very next navigation.
    expect(response.cookies.get('NEXT_LOCALE')).toBeUndefined();
  });

  it('replaces a cookie holding an unsupported locale', () => {
    const response = proxy(
      request('/', { cookies: { NEXT_LOCALE: 'de' }, acceptLanguage: 'uk' }),
    );

    expect(response.cookies.get('NEXT_LOCALE')?.value).toBe('uk');
  });

  it('defaults to English when the browser asks for nothing we serve', () => {
    const response = proxy(request('/', { acceptLanguage: 'fr-FR,fr;q=0.9' }));

    expect(response.cookies.get('NEXT_LOCALE')?.value).toBe('en');
  });

  it('leaves the cookie readable by JavaScript', () => {
    const response = proxy(request('/'));

    // It carries no authority, and a client-side widget knowing the display
    // language is useful.
    expect(response.cookies.get('NEXT_LOCALE')?.httpOnly).toBe(false);
  });
});

describe('protected routes', () => {
  it('redirects a signed-out visitor to sign-in', () => {
    const response = proxy(request('/account'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/sign-in');
  });

  it('remembers where they were headed', () => {
    const location =
      proxy(request('/institutions/abc/grades')).headers.get('location') ?? '';

    expect(new URL(location).searchParams.get('next')).toBe('/institutions/abc/grades');
  });

  it('lets a visitor holding an access token through', () => {
    const response = proxy(request('/account', { cookies: { sv_at: 'token' } }));

    expect(response.status).toBe(200);
  });

  it('forwards the nonce on a protected route too', () => {
    const response = proxy(request('/account', { cookies: { sv_at: 'token' } }));

    // A protected page renders the same inline theme script as a public one.
    // Letting it through without the nonce means the CSP blocks that script and
    // every authenticated page flashes the wrong theme.
    expect(forwardedNonce(response)).toBe(policyNonce(response));
    expect(policyNonce(response)).toBeTruthy();
  });

  it('lets a visitor holding only a refresh token through', () => {
    const response = proxy(request('/account', { cookies: { sv_rt: 'token' } }));

    // The page's own data fetch refreshes server-side; bouncing them to sign-in
    // would sign out every user whose access token merely expired.
    expect(response.status).toBe(200);
  });

  it('does not guard public routes', () => {
    expect(proxy(request('/')).status).toBe(200);
    expect(proxy(request('/sign-in')).status).toBe(200);
  });

  it('guards every signed-in section, not just the first one listed', () => {
    expect(proxy(request('/institutions')).status).toBe(307);
    expect(proxy(request('/institutions/abc/settings')).status).toBe(307);
  });

  it('does not treat a lookalike path as protected', () => {
    // `/accounts-public` starts with the same characters but is a different
    // route; prefix matching without the boundary check would guard it.
    expect(proxy(request('/account-public')).status).toBe(200);
  });
});
