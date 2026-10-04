import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { forgetRotations } from '@/shared/auth/token-rotation';

import { proxy } from './proxy';

// `@t3-oss/env-nextjs` refuses a server-only variable under jsdom, which it takes
// for a browser; the proxy only ever runs on the server.
vi.mock('@/env', () => ({
  env: {
    API_INTERNAL_URL: undefined,
    NEXT_PUBLIC_API_URL: 'http://localhost:3000',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3001',
  },
}));

/** Builds an unsigned JWT whose `exp` is `secondsFromNow` away. */
function tokenExpiringIn(secondsFromNow: number): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + secondsFromNow }),
  ).toString('base64url');

  return `header.${payload}.signature`;
}

const LIVE_TOKEN = tokenExpiringIn(600);
const LAPSED_TOKEN = tokenExpiringIn(-60);

const RENEWED = {
  accessToken: tokenExpiringIn(900),
  refreshToken: 'renewed-refresh-token',
  expiresIn: 900,
  tokenType: 'Bearer',
  user: { id: 'u1', email: 'ada@example.com', locale: 'en' },
};

beforeEach(() => {
  forgetRotations();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function request(
  path: string,
  options: {
    cookies?: Record<string, string>;
    acceptLanguage?: string;
    nonceHeader?: string;
    userAgent?: string;
  } = {},
): NextRequest {
  const headers = new Headers();
  if (options.userAgent) headers.set('user-agent', options.userAgent);
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
function forwardedNonce(response: Awaited<ReturnType<typeof proxy>>): string | null {
  return response.headers.get('x-middleware-request-x-nonce');
}

function policyNonce(response: Awaited<ReturnType<typeof proxy>>): string | undefined {
  return /'nonce-([A-Za-z0-9+/=]+)'/.exec(
    response.headers.get('content-security-policy') ?? '',
  )?.[1];
}

describe('security headers', () => {
  it('sets a CSP on every matched request', async () => {
    const response = await proxy(request('/'));

    expect(response.headers.get('content-security-policy')).toContain(
      `default-src 'self'`,
    );
  });

  it('hands the render the same nonce it put in the policy', async () => {
    const response = await proxy(request('/'));

    expect(forwardedNonce(response)).toBe(policyNonce(response));
    expect(policyNonce(response)).toBeTruthy();
  });

  it('overwrites a client-supplied nonce header', async () => {
    const response = await proxy(request('/', { nonceHeader: 'attacker-chosen' }));

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
  it('pins the negotiated locale on a first visit', async () => {
    const response = await proxy(request('/', { acceptLanguage: 'sk-SK,sk;q=0.9' }));

    expect(response.cookies.get('NEXT_LOCALE')?.value).toBe('sk');
  });

  it('leaves an existing choice alone', async () => {
    const response = await proxy(
      request('/', { cookies: { NEXT_LOCALE: 'sk' }, acceptLanguage: 'en-GB' }),
    );

    // Overwriting here would undo the switcher on the very next navigation.
    expect(response.cookies.get('NEXT_LOCALE')).toBeUndefined();
  });

  it('replaces a cookie holding an unsupported locale', async () => {
    const response = await proxy(
      request('/', { cookies: { NEXT_LOCALE: 'de' }, acceptLanguage: 'sk' }),
    );

    expect(response.cookies.get('NEXT_LOCALE')?.value).toBe('sk');
  });

  it('defaults to English when the browser asks for nothing we serve', async () => {
    const response = await proxy(request('/', { acceptLanguage: 'fr-FR,fr;q=0.9' }));

    expect(response.cookies.get('NEXT_LOCALE')?.value).toBe('en');
  });

  it('leaves the cookie readable by JavaScript', async () => {
    const response = await proxy(request('/'));

    // It carries no authority, and a client-side widget knowing the display
    // language is useful.
    expect(response.cookies.get('NEXT_LOCALE')?.httpOnly).toBe(false);
  });
});

describe('protected routes', () => {
  it('redirects a signed-out visitor to sign-in', async () => {
    const response = await proxy(request('/account'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/sign-in');
  });

  it('remembers where they were headed', async () => {
    const location =
      (await proxy(request('/institutions/abc/grades'))).headers.get('location') ?? '';

    expect(new URL(location).searchParams.get('next')).toBe('/institutions/abc/grades');
  });

  it('lets a visitor holding an access token through', async () => {
    const response = await proxy(request('/account', { cookies: { sv_at: LIVE_TOKEN } }));

    expect(response.status).toBe(200);
  });

  it('forwards the nonce on a protected route too', async () => {
    const response = await proxy(request('/account', { cookies: { sv_at: LIVE_TOKEN } }));

    // A protected page renders the same inline theme script as a public one.
    // Letting it through without the nonce means the CSP blocks that script and
    // every authenticated page flashes the wrong theme.
    expect(forwardedNonce(response)).toBe(policyNonce(response));
    expect(policyNonce(response)).toBeTruthy();
  });

  it('does not guard public routes', async () => {
    expect((await proxy(request('/'))).status).toBe(200);
    expect((await proxy(request('/sign-in'))).status).toBe(200);
  });

  it('guards every signed-in section, not just the first one listed', async () => {
    expect((await proxy(request('/institutions'))).status).toBe(307);
    expect((await proxy(request('/institutions/abc/settings'))).status).toBe(307);
  });

  it('does not treat a lookalike path as protected', async () => {
    // `/accounts-public` starts with the same characters but is a different
    // route; prefix matching without the boundary check would guard it.
    expect((await proxy(request('/account-public'))).status).toBe(200);
  });
});

describe('session renewal', () => {
  const refreshed = () => vi.fn(() => Promise.resolve(Response.json(RENEWED)));

  it('renews on behalf of the browser, so the session keeps naming its device', async () => {
    const fetchMock = refreshed();
    vi.stubGlobal('fetch', fetchMock);

    await proxy(
      request('/account', {
        cookies: { sv_at: LAPSED_TOKEN, sv_refresh: 'device-refresh-token' },
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/130.0',
      }),
    );

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(new Headers(init.headers).get('user-agent')).toBe(
      'Mozilla/5.0 (X11; Linux x86_64) Firefox/130.0',
    );
  });

  it('renews a lapsed access token before a protected page renders', async () => {
    const fetchMock = refreshed();
    vi.stubGlobal('fetch', fetchMock);

    const response = await proxy(
      request('/institutions/abc', {
        cookies: { sv_at: LAPSED_TOKEN, sv_refresh: 'stored-refresh-token' },
      }),
    );

    expect(response.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.body).toContain('stored-refresh-token');
    expect(response.cookies.get('sv_at')?.value).toBe(RENEWED.accessToken);
    expect(response.cookies.get('sv_refresh')).toMatchObject({
      value: RENEWED.refreshToken,
      path: '/',
      httpOnly: true,
    });
  });

  it('hands the render the renewed token, not the lapsed one', async () => {
    vi.stubGlobal('fetch', refreshed());

    const response = await proxy(
      request('/account', { cookies: { sv_refresh: 'stored-refresh-token' } }),
    );

    // The browser dropped the lapsed access cookie; the render still has to
    // read one, or it renders the page signed out.
    expect(response.headers.get('x-middleware-request-cookie')).toContain(
      `sv_at=${RENEWED.accessToken}`,
    );
  });

  it('rotates once for requests that race with the same cookie', async () => {
    const fetchMock = refreshed();
    vi.stubGlobal('fetch', fetchMock);
    const cookies = { sv_at: LAPSED_TOKEN, sv_refresh: 'stored-refresh-token' };

    // A page fanning out: the document and its prefetches all carry the same
    // spent-once token. Presenting it twice would end every session.
    await Promise.all([
      proxy(request('/institutions/abc', { cookies })),
      proxy(request('/institutions/abc/grades', { cookies })),
      proxy(request('/account', { cookies })),
    ]);

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('leaves a live access token alone', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await proxy(
      request('/account', {
        cookies: { sv_at: LIVE_TOKEN, sv_refresh: 'stored-refresh-token' },
      }),
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renews on a public page too, so its header shows the visitor signed in', async () => {
    vi.stubGlobal('fetch', refreshed());

    const response = await proxy(
      request('/', { cookies: { sv_refresh: 'stored-refresh-token' } }),
    );

    expect(response.cookies.get('sv_at')?.value).toBe(RENEWED.accessToken);
  });

  it('ends the session and sends the visitor to sign in when the refresh is refused', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
    );

    const response = await proxy(
      request('/account', {
        cookies: { sv_at: LAPSED_TOKEN, sv_refresh: 'revoked-refresh-token' },
      }),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/sign-in');
    expect(response.cookies.get('sv_refresh')?.maxAge).toBe(0);
    expect(response.cookies.get('sv_at')?.maxAge).toBe(0);
  });

  it('lets the page report an unreachable API rather than signing the visitor out', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('fetch failed'))),
    );

    const response = await proxy(
      request('/account', { cookies: { sv_refresh: 'stored-refresh-token' } }),
    );

    expect(response.status).toBe(200);
    expect(response.cookies.get('sv_refresh')).toBeUndefined();
  });
});
