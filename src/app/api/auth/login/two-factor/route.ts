import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import type { AuthTokensDto } from '@/shared/api';
import {
  apiOrigin,
  forbidden,
  isSameOrigin,
  relayFailure,
  releaseTwoFactorChallenge,
  respondWithSession,
  userAgentHeader,
} from '@/shared/auth';
import { TWO_FACTOR_CHALLENGE_COOKIE } from '@/shared/config';

const EXPIRED = 'TWO_FACTOR_CHALLENGE_EXPIRED';

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOrigin(request)) return forbidden();

  const challengeToken = (await cookies()).get(TWO_FACTOR_CHALLENGE_COOKIE)?.value;
  if (!challengeToken) {
    return NextResponse.json(
      { statusCode: 401, code: EXPIRED, message: 'Sign in again' },
      { status: 401 },
    );
  }

  const { code } = (await request.json().catch(() => ({}))) as { code?: unknown };

  const response = await fetch(`${apiOrigin()}/api/v1/auth/login/two-factor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...userAgentHeader(request.headers.get('user-agent')),
    },
    body: JSON.stringify({ challengeToken, code }),
    cache: 'no-store',
  });

  if (response.ok) {
    return releaseTwoFactorChallenge(
      respondWithSession((await response.json()) as AuthTokensDto),
    );
  }

  const failure = await relayFailure(response);
  const body = (await failure
    .clone()
    .json()
    .catch(() => null)) as { code?: string } | null;

  return body?.code === EXPIRED ? releaseTwoFactorChallenge(failure) : failure;
}
