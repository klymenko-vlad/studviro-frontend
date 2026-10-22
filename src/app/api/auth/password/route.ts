import { NextResponse } from 'next/server';

import type { AuthTokensDto } from '@/shared/api';
import {
  apiOrigin,
  forbidden,
  getAccessToken,
  isSameOrigin,
  relayFailure,
  respondWithSession,
  userAgentHeader,
} from '@/shared/auth';

/** Changing the password ends every session, so the API answers with this one's successor. */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOrigin(request)) return forbidden();

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ statusCode: 401, message: 'No session' }, { status: 401 });
  }

  const response = await fetch(`${apiOrigin()}/api/v1/users/me/password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${accessToken}`,
      ...userAgentHeader(request.headers.get('user-agent')),
    },
    body: await request.text(),
    cache: 'no-store',
  });

  if (!response.ok) return relayFailure(response);

  return respondWithSession((await response.json()) as AuthTokensDto);
}
