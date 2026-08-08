import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';

import type { AuthTokensDto } from '@/shared/api';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_COOKIE_MAX_AGE,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_COOKIE,
  sessionCookieOptions,
} from '@/shared/config/session';

import { apiOrigin } from './api-origin';

/** Refresh this many seconds before the token actually lapses. */
const EXPIRY_SKEW_SECONDS = 30;

export type SessionUser = AuthTokensDto['user'];

/**
 * `exp` read without verifying the signature — deliberately. This decides only
 * *when to bother refreshing*; the API verifies the token on every call, so a
 * forged one buys nothing but a wasted round trip.
 */
function isExpired(token: string): boolean {
  const payload = token.split('.')[1];
  if (!payload) return true;

  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      exp?: number;
    };

    if (typeof exp !== 'number') return true;

    return exp - EXPIRY_SKEW_SECONDS <= Math.floor(Date.now() / 1000);
  } catch {
    return true;
  }
}

/**
 * Exchanges the refresh cookie for a new pair.
 *
 * Wrapped in `cache` so a page fanning out ten parallel RSC fetches performs
 * one rotation rather than ten — every request after the first would present an
 * already-rotated token, which the API correctly reads as a leak and answers by
 * revoking every session the user has.
 */
const rotate = cache(async (refreshToken: string): Promise<AuthTokensDto | undefined> => {
  const response = await fetch(`${apiOrigin()}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });

  if (!response.ok) return undefined;

  return (await response.json()) as AuthTokensDto;
});

/**
 * A usable access token, refreshing it first if the stored one has lapsed.
 *
 * Returns `undefined` rather than throwing: "signed out" is an ordinary state
 * that callers branch on, not an exception.
 */
export const getAccessToken = cache(async (): Promise<string | undefined> => {
  const store = await cookies();

  const accessToken = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (accessToken && !isExpired(accessToken)) return accessToken;

  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) return undefined;

  const refreshed = await rotate(refreshToken);
  if (!refreshed) return undefined;

  await persist(refreshed);

  return refreshed.accessToken;
});

/**
 * Fetched rather than decoded out of the access token: a token minted up to
 * `JWT_ACCESS_TTL` ago carries a stale display name and, more importantly, a
 * stale locale — which is precisely the value the layout is about to render.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | undefined> => {
  const accessToken = await getAccessToken();
  if (!accessToken) return undefined;

  const response = await fetch(`${apiOrigin()}/api/v1/auth/me`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!response.ok) return undefined;

  return (await response.json()) as SessionUser;
});

/**
 * Writing cookies is only legal in a Server Action or Route Handler. During an
 * ordinary render Next throws, and that is fine: the rotated token still serves
 * this request, and the write lands on the next mutation or on the Route
 * Handler that browser-side calls go through.
 */
async function persist(tokens: AuthTokensDto): Promise<void> {
  try {
    const store = await cookies();

    store.set(
      ACCESS_TOKEN_COOKIE,
      tokens.accessToken,
      sessionCookieOptions('/', tokens.expiresIn),
    );
    store.set(
      REFRESH_TOKEN_COOKIE,
      tokens.refreshToken,
      sessionCookieOptions(REFRESH_COOKIE_PATH, REFRESH_COOKIE_MAX_AGE),
    );
  } catch {
    // Read-only cookie store — see above.
  }
}
