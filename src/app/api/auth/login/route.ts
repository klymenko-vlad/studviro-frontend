import { type NextResponse } from 'next/server';

import type { AuthTokensDto } from '@/shared/api';
import {
  apiOrigin,
  forbidden,
  holdTwoFactorChallenge,
  isSameOrigin,
  relayFailure,
  releaseTwoFactorChallenge,
  respondWithSession,
  userAgentHeader,
} from '@/shared/auth';

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOrigin(request)) return forbidden();

  const response = await fetch(`${apiOrigin()}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...userAgentHeader(request.headers.get('user-agent')),
    },
    body: await request.text(),
    cache: 'no-store',
  });

  if (!response.ok) {
    return (await holdTwoFactorChallenge(response)) ?? relayFailure(response);
  }

  return releaseTwoFactorChallenge(
    respondWithSession((await response.json()) as AuthTokensDto),
  );
}
