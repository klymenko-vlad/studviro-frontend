'use client';

import { useCallback, useState } from 'react';

import { takeCaptchaChallenge } from '../api/captcha-challenge';
import { solveChallenge } from './solve';

export type CaptchaStatus = 'idle' | 'solving' | 'solved' | 'failed';

export interface Captcha {
  readonly enabled: boolean;
  readonly status: CaptchaStatus;
  /**
   * Takes a challenge and solves it, answering with the payload to send.
   * `undefined` when the deployment has no captcha, which is the shape the
   * request body wants — the field is optional on the wire.
   */
  readonly solve: () => Promise<string | undefined>;
}

/**
 * `enabled` is passed in from the server rather than queried here: it is fixed
 * at deploy, and asking for it from the client cost React Query's observer
 * machinery on three routes that had no query at all.
 *
 * The challenge itself is taken on submit rather than on mount. It is
 * single-use and it expires, so one minted when the page opened is likely stale
 * by the time a person has finished typing — and solving one for a visitor who
 * never submits spends their battery for nothing.
 */
export function useCaptcha(enabled: boolean): Captcha {
  const [status, setStatus] = useState<CaptchaStatus>('idle');

  const solve = useCallback(async () => {
    if (!enabled) return undefined;

    setStatus('solving');
    try {
      const payload = await solveChallenge(await takeCaptchaChallenge());
      setStatus('solved');

      return payload;
    } catch (error) {
      setStatus('failed');
      throw error;
    }
  }, [enabled]);

  return { enabled, status, solve };
}
