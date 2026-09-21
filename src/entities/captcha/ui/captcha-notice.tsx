'use client';

import { LoaderCircle, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { CaptchaStatus } from '../model/use-captcha';

/**
 * Says what is happening while the browser hashes, and nothing at all when the
 * deployment asks for no captcha.
 *
 * A person who clicked submit and saw a second of silence deserves to know the
 * page is working rather than broken — and `aria-live` says it out loud,
 * because "wait, something is happening" is exactly the information a screen
 * reader user is otherwise denied.
 */
export function CaptchaNotice({
  enabled,
  status,
}: {
  enabled: boolean;
  status: CaptchaStatus;
}) {
  const t = useTranslations('captcha');

  if (!enabled) return null;

  return (
    <p
      className="text-muted-foreground flex items-center gap-2 text-xs"
      aria-live="polite"
      data-testid="captcha-notice"
    >
      {status === 'solving' ? (
        <>
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
          {t('solving')}
        </>
      ) : status === 'solved' ? (
        <>
          <ShieldCheck className="size-3.5" aria-hidden />
          {t('solved')}
        </>
      ) : status === 'failed' ? (
        t('failed')
      ) : (
        t('idle')
      )}
    </p>
  );
}
