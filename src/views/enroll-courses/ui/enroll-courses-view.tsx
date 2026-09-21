'use client';

import { useTranslations } from 'next-intl';

import { EnrollableCourses } from '@/widgets/enrollable-courses';
import { usePermissions } from '@/entities/permission';
import { Alert, AlertDescription, AlertTitle, PageHeader, PageShell } from '@/shared/ui';

export function EnrollCoursesView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('enrollment');
  const { can, isPending } = usePermissions(institutionId);

  return (
    <PageShell>
      <PageHeader title={t('title')} description={t('subtitle')} />

      {isPending ? null : can('offering:read') ? (
        <EnrollableCourses institutionId={institutionId} />
      ) : (
        <Alert>
          <AlertTitle>{t('deniedTitle')}</AlertTitle>
          <AlertDescription>{t('deniedDescription')}</AlertDescription>
        </Alert>
      )}
    </PageShell>
  );
}
