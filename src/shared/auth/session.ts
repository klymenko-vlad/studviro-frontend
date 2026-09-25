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
import { isExpired } from './token-expiry';
import { rotateRefreshToken } from './token-rotation';

export type SessionUser = AuthTokensDto['user'];

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

  const refreshed = await rotateRefreshToken(refreshToken);
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
 * Writing cookies is only legal in a Server Action or Route Handler; during an
 * ordinary render Next throws. A render should never get here: `src/proxy.ts`
 * renews a lapsed token before the page renders and hands the render the new
 * one. If one does, the rotation is shared for a while (`token-rotation.ts`), so
 * the requests right behind it are handed the same pair rather than spending it.
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
