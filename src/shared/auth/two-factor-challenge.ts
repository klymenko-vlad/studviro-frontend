import 'server-only';

import { NextResponse } from 'next/server';

import type { ErrorResponseDto } from '@/shared/api';
import {
  sessionCookieOptions,
  TWO_FACTOR_CHALLENGE_COOKIE,
  TWO_FACTOR_CHALLENGE_MAX_AGE,
  TWO_FACTOR_CHALLENGE_PATH,
} from '@/shared/config';

type ChallengeBody = ErrorResponseDto & {
  code?: string;
  details?: { challengeToken?: unknown };
};

/**
 * A correct password on an account with two-factor on: the API answers with a
 * challenge token, which goes into an httpOnly cookie instead of to the browser.
 */
export async function holdTwoFactorChallenge(
  response: Response,
): Promise<NextResponse | undefined> {
  if (response.status !== 401) return undefined;

  const body = (await response
    .clone()
    .json()
    .catch(() => null)) as ChallengeBody | null;
  const token = body?.details?.challengeToken;
  if (body?.code !== 'TWO_FACTOR_REQUIRED' || typeof token !== 'string') return undefined;

  const { details: _withheld, ...withoutToken } = body;
  const held = NextResponse.json(withoutToken, { status: 401 });
  held.cookies.set(
    TWO_FACTOR_CHALLENGE_COOKIE,
    token,
    sessionCookieOptions(TWO_FACTOR_CHALLENGE_PATH, TWO_FACTOR_CHALLENGE_MAX_AGE),
  );

  return held;
}

export function releaseTwoFactorChallenge(response: NextResponse): NextResponse {
  response.cookies.set(
    TWO_FACTOR_CHALLENGE_COOKIE,
    '',
    sessionCookieOptions(TWO_FACTOR_CHALLENGE_PATH, 0),
  );

  return response;
}
