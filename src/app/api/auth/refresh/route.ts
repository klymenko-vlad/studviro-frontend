import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  clearSession,
  forbidden,
  isSameOrigin,
  respondWithSession,
  rotateRefreshToken,
} from '@/shared/auth';
import { REFRESH_TOKEN_COOKIE } from '@/shared/config';

/**
 * The refresh token comes from the cookie, never from the request body — the
 * browser has no way to supply one, which is the entire point of the BFF.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOrigin(request)) return forbidden();

  const refreshToken = (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ message: 'No session' }, { status: 401 });
  }

  // Shared with every other renewal in the process: see `rotateRefreshToken`.
  const tokens = await rotateRefreshToken(
    refreshToken,
    request.headers.get('user-agent'),
  );

  if (!tokens) {
    /**
     * A rejected refresh means the token was revoked, expired, or replayed —
     * in every case the cookies are worthless, and leaving them in place would
     * keep the client retrying a rotation that can only fail.
     */
    return clearSession(
      NextResponse.json({ message: 'Session expired' }, { status: 401 }),
    );
  }

  return respondWithSession(tokens);
}
