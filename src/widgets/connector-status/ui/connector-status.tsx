'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { institutionConfigurationQueries } from '@/entities/institution-configuration';
import { Alert, AlertDescription, AlertTitle, Skeleton } from '@/shared/ui';

import { ConnectorStatusItem } from './connector-status-item';

export function ConnectorStatus({ institutionId }: { institutionId: string }) {
  const t = useTranslations('institutionSettings');
  const { data, isPending, isError } = useQuery(
    institutionConfigurationQueries.connectors({ path: { institutionId } }),
  );

  if (isPending) return <Skeleton className="h-24 w-full" />;

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('connectorsErrorTitle')}</AlertTitle>
        <AlertDescription>{t('connectorsErrorDescription')}</AlertDescription>
      </Alert>
    );
  }

  return (
    <ul className="divide-border divide-y">
      {data.map(status => (
        <ConnectorStatusItem key={status.kind} status={status} />
      ))}
    </ul>
  );
}
