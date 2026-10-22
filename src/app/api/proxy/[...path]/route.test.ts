import { describe, expect, it, vi } from 'vitest';

import type * as SharedAuth from '@/shared/auth';

import { GET, POST } from './route';

/**
 * `getAccessToken` reaches for `next/headers`, which only resolves inside a
 * request scope. These tests are about what the gateway refuses *before* it
 * gets that far, so the session is stubbed out rather than simulated.
 */
vi.mock('@/shared/auth', async importOriginal => ({
  ...(await importOriginal<typeof SharedAuth>()),
  getAccessToken: () => Promise.resolve('access-token-value'),
}));

function context(path: string[]) {
  return { params: Promise.resolve({ path }) };
}

function request(method: string, origin?: string): Request {
  return new Request('http://localhost:3001/api/proxy/api/v1/users', {
    method,
    ...(origin === undefined ? {} : { headers: { origin } }),
  });
}

describe('path traversal', () => {
  it.each([['..'], ['.'], ['']])('rejects a %o segment', async segment => {
    // Next decodes catch-all segments, so `%2e%2e` arrives here as `..` and
    // `fetch` would normalise it away — reaching API paths the browser was
    // never meant to address, with the session's bearer token attached.
    const response = await GET(request('GET'), context(['api', 'v1', segment, 'admin']));

    expect(response.status).toBe(400);
  });

  it('lets an ordinary path through the check', async () => {
    // No upstream is listening, so the fetch itself fails — reaching that point
    // is the assertion: the guard did not reject it.
    await expect(GET(request('GET'), context(['api', 'v1', 'users']))).rejects.toThrow();
  });
});

describe('token-issuing paths', () => {
  it.each([
    [['api', 'v1', 'auth', 'login']],
    [['api', 'v1', 'auth', 'login', 'two-factor']],
    [['api', 'v1', 'auth', 'refresh']],
    [['api', 'v1', 'users', 'me', 'password']],
  ])('refuses %o, so a token pair never reaches the browser', async path => {
    const response = await POST(request('POST', 'http://localhost:3001'), context(path));

    expect(response.status).toBe(404);
  });

  it.each([
    [['api', 'v1', 'auth', 'password-reset', 'request']],
    [['api', 'v1', 'auth', 'password-reset', 'some-token', 'confirm']],
  ])('forwards %o, which answers with no session token', async path => {
    // Refused along with the rest of `auth/*`, the forgot-password form answered
    // its usual "check your inbox" while nothing reached the API.
    await expect(
      POST(request('POST', 'http://localhost:3001'), context(path)),
    ).rejects.toThrow();
  });

  it('still forwards the rest of the account', async () => {
    await expect(
      GET(
        request('GET'),
        context(['api', 'v1', 'users', 'me', 'passwords-are-not-this']),
      ),
    ).rejects.toThrow();
  });
});

describe('cross-origin writes', () => {
  it('rejects a write from another origin', async () => {
    const response = await POST(
      request('POST', 'https://evil.example'),
      context(['api', 'v1', 'users']),
    );

    expect(response.status).toBe(403);
  });

  it('checks the origin before the path', async () => {
    // Order matters only in that neither check may be skippable by failing the
    // other; a traversal from off-origin must not answer 400 and leak that the
    // path check exists.
    const response = await POST(request('POST', 'https://evil.example'), context(['..']));

    expect(response.status).toBe(403);
  });
});
