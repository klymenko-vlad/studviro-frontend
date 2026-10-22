import { NextResponse } from 'next/server';
import { describe, expect, it } from 'vitest';

import {
  holdTwoFactorChallenge,
  releaseTwoFactorChallenge,
} from './two-factor-challenge';

function apiAnswer(status: number, body: unknown): Response {
  return Response.json(body, { status });
}

describe('holdTwoFactorChallenge', () => {
  it('moves the challenge token into an httpOnly cookie and out of the body', async () => {
    const held = await holdTwoFactorChallenge(
      apiAnswer(401, {
        statusCode: 401,
        code: 'TWO_FACTOR_REQUIRED',
        message: 'Enter the code',
        details: { challengeToken: 'challenge-secret' },
      }),
    );

    expect(held?.status).toBe(401);
    const body = (await held?.json()) as Record<string, unknown>;
    expect(body).toMatchObject({ code: 'TWO_FACTOR_REQUIRED' });
    expect(JSON.stringify(body)).not.toContain('challenge-secret');
    expect(held?.cookies.get('sv_2fa')).toMatchObject({
      value: 'challenge-secret',
      httpOnly: true,
      path: '/api/auth/login',
      maxAge: 300,
    });
  });

  it('leaves an ordinary wrong password to the usual relay', async () => {
    const wrong = apiAnswer(401, { statusCode: 401, code: 'INVALID_CREDENTIALS' });

    expect(await holdTwoFactorChallenge(wrong)).toBeUndefined();
    expect(await wrong.json()).toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('ignores a challenge with no token, and any other status', async () => {
    expect(
      await holdTwoFactorChallenge(apiAnswer(401, { code: 'TWO_FACTOR_REQUIRED' })),
    ).toBeUndefined();
    expect(
      await holdTwoFactorChallenge(
        apiAnswer(400, {
          code: 'TWO_FACTOR_REQUIRED',
          details: { challengeToken: 'x' },
        }),
      ),
    ).toBeUndefined();
  });
});

describe('releaseTwoFactorChallenge', () => {
  it('expires the cookie on the path it was set under', () => {
    const released = releaseTwoFactorChallenge(NextResponse.json({}));

    expect(released.cookies.get('sv_2fa')).toMatchObject({
      value: '',
      path: '/api/auth/login',
      maxAge: 0,
    });
  });
});
