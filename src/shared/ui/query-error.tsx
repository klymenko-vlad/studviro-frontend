'use client';

import type { ReactNode } from 'react';
import { RotateCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Alert, AlertDescription, AlertTitle } from './alert';
import { Button } from './button';

/**
 * A query that failed, told apart from a query that succeeded and found
 * nothing — and carrying the way out. Before this the two rendered as the same
 * muted sentence in some widgets and as an `Alert` in others, and neither
 * offered a retry.
 */
export function QueryError({
  title,
  description,
  onRetry,
  ...rest
}: {
  title: ReactNode;
  description?: ReactNode;
  onRetry?: () => void;
} & { 'data-testid'?: string }) {
  const t = useTranslations('common');

  return (
    <Alert variant="destructive" {...rest}>
      <AlertTitle>{title}</AlertTitle>
      {description === undefined ? null : (
        <AlertDescription>{description}</AlertDescription>
      )}
      {onRetry === undefined ? null : (
        <Button variant="outline" size="sm" className="mt-3 w-fit" onClick={onRetry}>
          <RotateCw aria-hidden />
          {t('retry')}
        </Button>
      )}
    </Alert>
  );
}
