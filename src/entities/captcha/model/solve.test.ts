import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import type { CaptchaChallengeDto } from '@/shared/api';

import { CaptchaUnsolvable, solveChallenge } from './solve';

const sha256 = (value: string) =>
  createHash('sha256').update(value, 'utf8').digest('hex');

const challengeFor = (
  answer: number,
  overrides: Partial<CaptchaChallengeDto> = {},
): CaptchaChallengeDto => ({
  algorithm: 'SHA-256',
  salt: 'abc123?expires=4102444800',
  challenge: sha256(`abc123?expires=4102444800${answer}`),
  maxnumber: 500,
  signature: 'a-signature',
  ...overrides,
});

const decode = (payload: string) =>
  JSON.parse(Buffer.from(payload, 'base64').toString('utf8')) as Record<string, unknown>;

describe('solveChallenge', () => {
  it('finds the number the server hashed', async () => {
    const payload = await solveChallenge(challengeFor(37));

    expect(decode(payload)['number']).toBe(37);
  });

  it('finds zero, which a loop starting at one would miss', async () => {
    const payload = await solveChallenge(challengeFor(0));

    expect(decode(payload)['number']).toBe(0);
  });

  it('finds the last number in the range, which an exclusive bound would miss', async () => {
    const payload = await solveChallenge(challengeFor(500));

    expect(decode(payload)['number']).toBe(500);
  });

  it('sends back everything the server needs to check its own signature', async () => {
    const challenge = challengeFor(12);

    expect(decode(await solveChallenge(challenge))).toEqual({
      algorithm: 'SHA-256',
      challenge: challenge.challenge,
      salt: challenge.salt,
      number: 12,
      signature: challenge.signature,
    });
  });

  it('gives up rather than looping for ever when there is no answer', async () => {
    const impossible = challengeFor(1, { challenge: sha256('nothing hashes to this') });

    await expect(solveChallenge(impossible)).rejects.toBeInstanceOf(CaptchaUnsolvable);
  });

  it('stops when the caller aborts, so leaving the page does not keep hashing', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      solveChallenge(challengeFor(9_000, { maxnumber: 10_000 }), controller.signal),
    ).rejects.toThrow();
  });
});
