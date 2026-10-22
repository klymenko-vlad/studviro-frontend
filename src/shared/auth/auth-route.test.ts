import { describe, expect, it, vi } from 'vitest';

import type { AuthTokensDto } from '@/shared/api';

import {
  clearSession,
  forbidden,
  isSameOrigin,
  relayFailure,
  respondWithSession,
} from './auth-route';

const TOKENS: AuthTokensDto = {
  accessToken: 'access-token-value',
  refreshToken: 'refresh-token-value',
  expiresIn: 900,
  tokenType: 'Bearer',
  user: {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'ada@example.com',
    displayName: 'Ada Lovelace',
    locale: 'sk',
    role: 'user',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
};

function request(origin: string | null): Request {
  return new Request('http://localhost:3001/api/auth/login', {
    method: 'POST',
    ...(origin === null ? {} : { headers: { origin } }),
  });
}

describe('isSameOrigin', () => {
  it('accepts this app’s own origin', () => {
    expect(isSameOrigin(request('http://localhost:3001'))).toBe(true);
  });

  it('rejects another origin', () => {
    expect(isSameOrigin(request('https://evil.example'))).toBe(false);
  });

  it('rejects a lookalike origin rather than matching on prefix', () => {
    expect(isSameOrigin(request('http://localhost:3001.evil.example'))).toBe(false);
  });

  it('rejects a request with no Origin at all', () => {
    // A same-origin browser `fetch` always sends one. Its absence means a
    // non-browser client, which these routes do not exist for.
    expect(isSameOrigin(request(null))).toBe(false);
  });

  describe('on a host other than the configured one', () => {
    const PREVIEW = 'studviro-frontend-git-dev-team.vercel.app';

    function servedFrom(origin: string, headers: Record<string, string>): Request {
      return new Request(`https://${PREVIEW}/api/auth/login`, {
        method: 'POST',
        headers: { origin, ...headers },
      });
    }

    it('accepts a request from the host it was served on', () => {
      expect(
        isSameOrigin(servedFrom(`https://${PREVIEW}`, { 'x-forwarded-host': PREVIEW })),
      ).toBe(true);
    });

    it('falls back to the Host header without a forwarding proxy', () => {
      expect(isSameOrigin(servedFrom(`https://${PREVIEW}`, { host: PREVIEW }))).toBe(
        true,
      );
    });

    it('rejects another origin posting to that host', () => {
      expect(
        isSameOrigin(servedFrom('https://evil.example', { 'x-forwarded-host': PREVIEW })),
      ).toBe(false);
    });

    it('rejects a lookalike of that host', () => {
      expect(
        isSameOrigin(
          servedFrom(`https://${PREVIEW}.evil.example`, { 'x-forwarded-host': PREVIEW }),
        ),
      ).toBe(false);
    });

    it('rejects a malformed Origin', () => {
      expect(isSameOrigin(servedFrom('null', { 'x-forwarded-host': PREVIEW }))).toBe(
        false,
      );
    });
  });

  it('accepts its own origin when the configured URL carries a trailing slash', async () => {
    // `NEXT_PUBLIC_APP_URL` is validated as a URL, not an origin, so a trailing
    // slash is legal configuration. Compared as a raw string it would reject
    // every authenticated request in production while passing locally.
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3001/');

    const { isSameOrigin: withTrailingSlash } = await import('./auth-route');

    expect(withTrailingSlash(request('http://localhost:3001'))).toBe(true);

    vi.unstubAllEnvs();
    vi.resetModules();
  });
});

describe('respondWithSession', () => {
  const cookiesOf = (response: ReturnType<typeof respondWithSession>) =>
    Object.fromEntries(response.cookies.getAll().map(cookie => [cookie.name, cookie]));

  it('returns the user and no token', async () => {
    const response = respondWithSession(TOKENS);
    const body = (await response.json()) as Record<string, unknown>;

    expect(body).toEqual({ user: TOKENS.user });
    expect(JSON.stringify(body)).not.toContain(TOKENS.accessToken);
    expect(JSON.stringify(body)).not.toContain(TOKENS.refreshToken);
  });

  it('stores the access token httpOnly, on every path', () => {
    const { sv_at: accessCookie } = cookiesOf(respondWithSession(TOKENS));

    expect(accessCookie?.value).toBe(TOKENS.accessToken);
    expect(accessCookie?.httpOnly).toBe(true);
    expect(accessCookie?.sameSite).toBe('lax');
    expect(accessCookie?.path).toBe('/');
    expect(accessCookie?.maxAge).toBe(TOKENS.expiresIn);
  });

  it('sends the refresh token wherever a lapsed session has to be renewed', () => {
    const { sv_refresh: refreshCookie } = cookiesOf(respondWithSession(TOKENS));

    expect(refreshCookie?.value).toBe(TOKENS.refreshToken);
    expect(refreshCookie?.httpOnly).toBe(true);
    // Scoped to `/api/auth` it never reached a page or the API proxy, and every
    // session ended with its first access token (ADR 0036).
    expect(refreshCookie?.path).toBe('/');
  });
});

describe('clearSession', () => {
  it('expires both cookies under the paths they were written with', () => {
    const cleared = clearSession(respondWithSession(TOKENS));
    const byName = Object.fromEntries(
      cleared.cookies.getAll().map(cookie => [`${cookie.name}:${cookie.path}`, cookie]),
    );

    // A mismatched path leaves the original cookie in place and the user
    // apparently still signed in.
    expect(byName['sv_at:/']?.maxAge).toBe(0);
    expect(byName['sv_refresh:/']?.maxAge).toBe(0);
    // And the one a browser signed in before ADR 0036 may still hold.
    expect(byName['sv_rt:/api/auth']?.maxAge).toBe(0);
  });
});

describe('relayFailure', () => {
  it('forwards the API status and body', async () => {
    const upstream = Response.json(
      { statusCode: 409, message: 'Email already registered' },
      { status: 409 },
    );

    const relayed = await relayFailure(upstream);

    expect(relayed.status).toBe(409);
    expect(await relayed.json()).toMatchObject({ message: 'Email already registered' });
  });

  it('still answers when the API sent no JSON', async () => {
    const relayed = await relayFailure(new Response('gateway timeout', { status: 504 }));

    expect(relayed.status).toBe(504);
    expect(await relayed.json()).toMatchObject({ message: 'Request failed' });
  });
});

describe('forbidden', () => {
  it('is a 403, not a 401 — the caller is not unauthenticated, it is off-origin', () => {
    expect(forbidden().status).toBe(403);
  });
});
