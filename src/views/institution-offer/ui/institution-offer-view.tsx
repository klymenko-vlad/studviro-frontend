'use client';

import { useTranslations } from 'next-intl';

import { Catalogue } from '@/widgets/catalogue';
import { CourseOfferings } from '@/widgets/course-offerings';
import { LearningSpaces } from '@/widgets/learning-spaces';
import { PageTabs, type PageTab } from '@/widgets/page-tabs';
import { usePermissions } from '@/entities/permission';
import { Alert, AlertDescription, AlertTitle, PageHeader, PageShell } from '@/shared/ui';

/**
 * What the institution teaches: the programmes and courses it has, the
 * offerings of them each term, and the course pages behind those.
 */
export function InstitutionOfferView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('hubs.offer');
  const { can, isPending } = usePermissions(institutionId);

  const tabs: PageTab<'catalogue' | 'offerings' | 'learning'>[] = [
    ...(can('course:read')
      ? [
          {
            key: 'catalogue' as const,
            label: t('tabs.catalogue'),
            content: <Catalogue institutionId={institutionId} />,
          },
        ]
      : []),
    ...(can('offering:read')
      ? [
          {
            key: 'offerings' as const,
            label: t('tabs.offerings'),
            content: <CourseOfferings institutionId={institutionId} />,
          },
        ]
      : []),
    ...(can('offering:manage')
      ? [
          {
            key: 'learning' as const,
            label: t('tabs.learning'),
            content: <LearningSpaces institutionId={institutionId} />,
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
