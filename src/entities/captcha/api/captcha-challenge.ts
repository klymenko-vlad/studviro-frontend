import type { CaptchaChallengeDto } from '@/shared/api';

/**
 * Taken with `fetch` rather than through the generated SDK, for the same
 * reason `sessionApi` is: the shapes are still the generated types, so a change
 * to the endpoint fails the typecheck here rather than at runtime.
 */
export async function takeCaptchaChallenge(): Promise<CaptchaChallengeDto> {
  const response = await fetch('/api/proxy/api/v1/captcha/challenge', {
    method: 'POST',
    credentials: 'same-origin',
  });

  if (!response.ok) throw new Error('A captcha challenge could not be taken');

  return (await response.json()) as CaptchaChallengeDto;
}
