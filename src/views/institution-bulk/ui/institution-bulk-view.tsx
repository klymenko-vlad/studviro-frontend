'use client';

import { useTranslations } from 'next-intl';

import { BulkEntry } from '@/widgets/bulk-entry';
import { usePermissions } from '@/entities/permission';
import { Alert, AlertDescription, AlertTitle, PageHeader, PageShell } from '@/shared/ui';

export function InstitutionBulkView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('bulkEntry');
  const { can, isPending } = usePermissions(institutionId);
  const allowed = can('offering:manage') || can('program:manage');

  return (
    <PageShell width="detail">
      <PageHeader title={t('title')} description={t('subtitle')} />

      {isPending ? null : allowed ? (
        <BulkEntry institutionId={institutionId} />
      ) : (
        <Alert>
          <AlertTitle>{t('deniedTitle')}</AlertTitle>
          <AlertDescription>{t('deniedDescription')}</AlertDescription>
        </Alert>
      )}
    </PageShell>
  );
}
