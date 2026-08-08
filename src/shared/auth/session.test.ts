import type * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieStore = vi.hoisted(() => {
  const jar = new Map<string, string>();

  return {
    jar,
    get: vi.fn((name: string) => {
      const value = jar.get(name);
      return value === undefined ? undefined : { name, value };
    }),
    set: vi.fn((name: string, value: string) => {
      jar.set(name, value);
    }),
  };
});

vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve(cookieStore),
}));

/**
 * `@t3-oss/env-nextjs` refuses to read a server-only variable when it believes
 * it is on the client, and under jsdom it always believes that. The module
 * under test only ever runs on the server, so the guard is stubbing out an
 * environment the code never sees rather than a behaviour worth asserting.
 */
vi.mock('@/env', () => ({
  env: {
    API_INTERNAL_URL: undefined,
    NEXT_PUBLIC_API_URL: 'http://localhost:3000',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3001',
  },
}));

// React's `cache` memoises per request; there is no request here, so identity
// is all we need — the single-flight behaviour it provides in production is
// asserted separately below by counting fetches within one call.
vi.mock('react', async importOriginal => ({
  ...(await importOriginal<typeof React>()),
  cache: <T>(fn: T) => fn,
}));

/** Builds an unsigned JWT whose `exp` is `secondsFromNow` away. */
function tokenExpiringIn(secondsFromNow: number): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + secondsFromNow }),
  ).toString('base64url');

  return `header.${payload}.signature`;
}

const REFRESHED = {
  accessToken: tokenExpiringIn(900),
  refreshToken: 'rotated-refresh-token',
  expiresIn: 900,
  tokenType: 'Bearer',
  user: { id: 'u1', email: 'ada@example.com', locale: 'en' },
};

function loadSession() {
  return import('./session');
}

describe('getAccessToken', () => {
  beforeEach(() => {
    cookieStore.jar.clear();
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('returns a live access token without calling the API', async () => {
    const live = tokenExpiringIn(600);
    cookieStore.jar.set('sv_at', live);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { getAccessToken } = await loadSession();

    expect(await getAccessToken()).toBe(live);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refreshes shortly *before* expiry rather than after', async () => {
    // Inside the skew window: still technically valid, but a request made with
    // it could land after it lapses.
    cookieStore.jar.set('sv_at', tokenExpiringIn(5));
    cookieStore.jar.set('sv_rt', 'stored-refresh-token');
    const fetchMock = vi.fn(() => Promise.resolve(Response.json(REFRESHED)));
    vi.stubGlobal('fetch', fetchMock);

    const { getAccessToken } = await loadSession();

    expect(await getAccessToken()).toBe(REFRESHED.accessToken);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('refreshes with the stored refresh token when the access token has lapsed', async () => {
    cookieStore.jar.set('sv_at', tokenExpiringIn(-60));
    cookieStore.jar.set('sv_rt', 'stored-refresh-token');
    const fetchMock = vi.fn(() => Promise.resolve(Response.json(REFRESHED)));
    vi.stubGlobal('fetch', fetchMock);

    const { getAccessToken } = await loadSession();
    const token = await getAccessToken();

    expect(token).toBe(REFRESHED.accessToken);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.body).toContain('stored-refresh-token');
  });

  it('persists the rotated pair so the next request does not rotate again', async () => {
    cookieStore.jar.set('sv_at', tokenExpiringIn(-60));
    cookieStore.jar.set('sv_rt', 'stored-refresh-token');
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(Response.json(REFRESHED))),
    );

    const { getAccessToken } = await loadSession();
    await getAccessToken();

    // Rotation invalidates the old refresh token; failing to store the new one
    // means the next request replays a spent token, which the API reads as a
    // leak and answers by revoking every session.
    expect(cookieStore.jar.get('sv_rt')).toBe(REFRESHED.refreshToken);
    expect(cookieStore.jar.get('sv_at')).toBe(REFRESHED.accessToken);
  });

  it('is signed out when there is no refresh token to fall back on', async () => {
    cookieStore.jar.set('sv_at', tokenExpiringIn(-60));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { getAccessToken } = await loadSession();

    expect(await getAccessToken()).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('is signed out when the refresh is rejected', async () => {
    cookieStore.jar.set('sv_rt', 'revoked-refresh-token');
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
    );

    const { getAccessToken } = await loadSession();

    expect(await getAccessToken()).toBeUndefined();
  });

  it('treats a malformed access token as expired instead of trusting it', async () => {
    cookieStore.jar.set('sv_at', 'not-a-jwt');
    cookieStore.jar.set('sv_rt', 'stored-refresh-token');
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(Response.json(REFRESHED))),
    );

    const { getAccessToken } = await loadSession();

    expect(await getAccessToken()).toBe(REFRESHED.accessToken);
  });

  it('treats a token with no exp claim as expired', async () => {
    const noExp = `header.${Buffer.from(JSON.stringify({ sub: 'u1' })).toString('base64url')}.sig`;
    cookieStore.jar.set('sv_at', noExp);
    cookieStore.jar.set('sv_rt', 'stored-refresh-token');
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(Response.json(REFRESHED))),
    );

    const { getAccessToken } = await loadSession();

    expect(await getAccessToken()).toBe(REFRESHED.accessToken);
  });
});

describe('getCurrentUser', () => {
  beforeEach(() => {
    cookieStore.jar.clear();
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('fetches the user rather than decoding a possibly stale token', async () => {
    cookieStore.jar.set('sv_at', tokenExpiringIn(600));
    const fetchMock = vi.fn(() => Promise.resolve(Response.json(REFRESHED.user)));
    vi.stubGlobal('fetch', fetchMock);

    const { getCurrentUser } = await loadSession();
    const user = await getCurrentUser();

    expect(user).toMatchObject({ email: 'ada@example.com' });
    // A token minted up to JWT_ACCESS_TTL ago carries a stale locale, which is
    // exactly the value the layout is about to render.
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/api/v1/auth/me');
    expect((init.headers as Record<string, string>)['authorization']).toContain('Bearer');
  });

  it('is undefined when signed out', async () => {
    vi.stubGlobal('fetch', vi.fn());

    const { getCurrentUser } = await loadSession();

    expect(await getCurrentUser()).toBeUndefined();
  });

  it('is undefined when the API rejects the token', async () => {
    cookieStore.jar.set('sv_at', tokenExpiringIn(600));
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
    );

    const { getCurrentUser } = await loadSession();

    expect(await getCurrentUser()).toBeUndefined();
  });
});
