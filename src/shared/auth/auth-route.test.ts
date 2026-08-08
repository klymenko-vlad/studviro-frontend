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
    locale: 'uk',
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

  it('scopes the refresh token to the endpoints that redeem it', () => {
    const { sv_rt: refreshCookie } = cookiesOf(respondWithSession(TOKENS));

    expect(refreshCookie?.value).toBe(TOKENS.refreshToken);
    expect(refreshCookie?.httpOnly).toBe(true);
    // The narrow path is what caps a forced-request attack at the access
    // token's lifetime instead of the refresh token's.
    expect(refreshCookie?.path).toBe('/api/auth');
  });

  it('adopts the language stored on the account', () => {
    const { NEXT_LOCALE: localeCookie } = cookiesOf(respondWithSession(TOKENS));

    // Signing in on a new device brings your language with you rather than
    // adopting that device's browser setting.
    expect(localeCookie?.value).toBe('uk');
    expect(localeCookie?.httpOnly).toBe(false);
  });

  it('leaves the locale cookie alone when the account holds one we do not serve', () => {
    // The DTO types `locale` as our own union, but the value is whatever the
    // API actually sent — the cast is the point of the test, not a shortcut.
    const drifted = {
      ...TOKENS,
      user: { ...TOKENS.user, locale: 'de' as AuthTokensDto['user']['locale'] },
    };

    const { NEXT_LOCALE: localeCookie } = cookiesOf(respondWithSession(drifted));

    // Writing it would leave `request.ts` falling back to `Accept-Language` on
    // every render until the user switched manually.
    expect(localeCookie).toBeUndefined();
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
