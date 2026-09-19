'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

import { logger } from '@/shared/lib';
import { Button } from '@/shared/ui';

/**
 * Segment-level error boundary. Catches render and data errors below this route
 * while keeping the layout (nav, shell) mounted.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('error');
  const tCommon = useTranslations('common');

  useEffect(() => {
    // `digest` is the only handle on the server-side stack, which is withheld
    // from the client — it is what correlates this boundary with the server log
    // that `instrumentation.ts#onRequestError` wrote for the same failure.
    logger.error('client error boundary caught', { error, digest: error.digest });
  }, [error]);

  return (
    <main
      id="main-content"
      className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="text-muted-foreground max-w-prose">{t('description')}</p>
      {error.digest ? (
        <code className="text-muted-foreground text-xs">{error.digest}</code>
      ) : null}
      <Button onClick={reset}>{tCommon('retry')}</Button>
    </main>
  );
}
