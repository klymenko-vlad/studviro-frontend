'use client';

import { useTranslations } from 'next-intl';

import { LearningSpaces } from '@/widgets/learning-spaces';
import { usePermissions } from '@/entities/permission';
import { Alert, AlertDescription, AlertTitle, PageHeader, PageShell } from '@/shared/ui';

export function InstitutionLearningView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('learning');
  const { can, isPending } = usePermissions(institutionId);

  return (
    <PageShell>
      <PageHeader title={t('title')} description={t('subtitle')} />

      {isPending ? null : can('offering:manage') ? (
        <LearningSpaces institutionId={institutionId} />
      ) : (
        <Alert>
          <AlertTitle>{t('deniedTitle')}</AlertTitle>
          <AlertDescription>{t('deniedDescription')}</AlertDescription>
        </Alert>
      )}
    </PageShell>
  );
}
