import type { CaptchaChallengeDto } from '@/shared/api';

/**
 * How many hashes to try before handing the main thread back. The work is one
 * SHA-256 of a short string, so a slice of this size is a fraction of a frame —
 * small enough that the page keeps painting, large enough that the yields do
 * not cost more than the hashing.
 */
const SLICE = 2_000;

export class CaptchaUnsolvable extends Error {
  constructor() {
    super('The verification challenge had no answer inside the range it advertised');
    this.name = 'CaptchaUnsolvable';
  }
}

/**
 * Finds the number the server hashed, by hashing.
 *
 * This is the whole of the captcha: there is nothing to read, click or fail,
 * and no third party is told the visitor was here. The cost is linear in how
 * many times the form is submitted, which is what makes a bulk sign-up
 * expensive and one honest sign-up free.
 */
export async function solveChallenge(
  challenge: CaptchaChallengeDto,
  signal?: AbortSignal,
): Promise<string> {
  const encoder = new TextEncoder();

  for (let number = 0; number <= challenge.maxnumber; number += 1) {
    if (number % SLICE === 0 && number > 0) {
      signal?.throwIfAborted();
      await yieldToPaint();
    }

    const digest = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(challenge.salt + String(number)),
    );

    if (toHex(digest) === challenge.challenge) {
      return encodePayload(challenge, number);
    }
  }

  throw new CaptchaUnsolvable();
}

function encodePayload(challenge: CaptchaChallengeDto, number: number): string {
  return btoa(
    JSON.stringify({
      algorithm: challenge.algorithm,
      challenge: challenge.challenge,
      salt: challenge.salt,
      number,
      signature: challenge.signature,
    }),
  );
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function yieldToPaint(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}
