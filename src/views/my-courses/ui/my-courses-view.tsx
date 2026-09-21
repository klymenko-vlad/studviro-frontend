'use client';

import { useTranslations } from 'next-intl';

import { MyCourses } from '@/widgets/my-courses';
import { usePermissions } from '@/entities/permission';
import { Alert, AlertDescription, AlertTitle, PageHeader, PageShell } from '@/shared/ui';

export function MyCoursesView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('myCourses');
  const { can, isPending } = usePermissions(institutionId);

  return (
    <PageShell>
      <PageHeader title={t('title')} description={t('subtitle')} />

      {isPending ? null : can('enrollment:read') ? (
        <MyCourses institutionId={institutionId} />
      ) : (
        <Alert>
          <AlertTitle>{t('deniedTitle')}</AlertTitle>
          <AlertDescription>{t('deniedDescription')}</AlertDescription>
        </Alert>
      )}
    </PageShell>
  );
}
