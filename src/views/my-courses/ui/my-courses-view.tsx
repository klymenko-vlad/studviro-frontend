'use client';

import { useTranslations } from 'next-intl';

import { EnrollableCourses } from '@/widgets/enrollable-courses';
import { MyCourses } from '@/widgets/my-courses';
import { PageTabs, type PageTab } from '@/widgets/page-tabs';
import { useInstitutionFeatures } from '@/entities/institution-configuration';
import { usePermissions } from '@/entities/permission';
import { Alert, AlertDescription, AlertTitle, PageHeader, PageShell } from '@/shared/ui';

/**
 * Everything a student does with courses in one place: the ones they take,
 * and — on the second tab — the ones they could still take. Finding a course
 * used to be a menu entry of its own (`/enroll`, which now redirects here).
 */
export function MyCoursesView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('myCourses');
  const { can, isPending } = usePermissions(institutionId);
  const features = useInstitutionFeatures(institutionId);

  const tabs: PageTab<'mine' | 'find'>[] = [
    ...(can('enrollment:read')
      ? [
          {
            key: 'mine' as const,
            label: t('tabs.mine'),
            content: <MyCourses institutionId={institutionId} />,
          },
        ]
      : []),
    ...(can('course:enroll') &&
    can('offering:read') &&
    features.isEnabled('courseRegistration')
      ? [
          {
            key: 'find' as const,
            label: t('tabs.find'),
            content: <EnrollableCourses institutionId={institutionId} />,
          },
        ]
      : []),
  ];

  return (
    <PageShell>
      <PageHeader title={t('title')} description={t('subtitle')} />

      {isPending ? null : tabs.length > 0 ? (
        <PageTabs tabs={tabs} label={t('title')} />
      ) : (
        <Alert>
          <AlertTitle>{t('deniedTitle')}</AlertTitle>
          <AlertDescription>{t('deniedDescription')}</AlertDescription>
        </Alert>
      )}
    </PageShell>
  );
}
