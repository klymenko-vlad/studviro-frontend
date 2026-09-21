'use client';

import { useTranslations } from 'next-intl';

import { MyGrades } from '@/widgets/my-grades';
import { usePermissions } from '@/entities/permission';
import { Alert, AlertDescription, AlertTitle, PageHeader, PageShell } from '@/shared/ui';

export function MyGradesView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('grades');
  const { can, isPending } = usePermissions(institutionId);

  return (
    <PageShell>
      <PageHeader title={t('title')} description={t('subtitle')} />

      {isPending ? null : can('grade:read') ? (
        <MyGrades institutionId={institutionId} />
      ) : (
        <Alert>
          <AlertTitle>{t('deniedTitle')}</AlertTitle>
          <AlertDescription>{t('deniedDescription')}</AlertDescription>
        </Alert>
      )}
    </PageShell>
  );
}
