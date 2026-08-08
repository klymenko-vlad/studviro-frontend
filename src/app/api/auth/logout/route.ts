import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { apiOrigin, clearSession, forbidden, isSameOrigin } from '@/shared/auth';
import { REFRESH_TOKEN_COOKIE } from '@/shared/config';

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOrigin(request)) return forbidden();

  const refreshToken = (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;

  if (refreshToken) {
    /**
     * Best effort. If the API is unreachable the cookies are still cleared —
     * a sign-out that appears to fail because the network did is worse than a
     * refresh token that lives out its remaining TTL unused on the server.
     */
    await fetch(`${apiOrigin()}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    }).catch(() => undefined);
  }

  return clearSession(new NextResponse(null, { status: 204 }));
}
