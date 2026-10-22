'use client';

import { useTranslations } from 'next-intl';

import { AcademicTerms } from '@/widgets/academic-terms';
import { OrgUnitTree } from '@/widgets/org-unit-tree';
import { PageTabs, type PageTab } from '@/widgets/page-tabs';
import { Rooms } from '@/widgets/rooms';
import { usePermissions } from '@/entities/permission';
import { Card, CardContent, PageHeader, PageShell } from '@/shared/ui';

/**
 * How the institution is built, before anything is taught in it: its units,
 * its rooms and its terms. The first stop of setting one up.
 */
export function InstitutionStructureView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('hubs.structure');
  const { can, isPending } = usePermissions(institutionId);

  const tabs: PageTab<'units' | 'rooms' | 'terms'>[] = [
    {
      key: 'units',
      label: t('tabs.units'),
      content: (
        <Card>
          <CardContent>
            <OrgUnitTree institutionId={institutionId} />
          </CardContent>
        </Card>
      ),
    },
    {
      key: 'rooms',
      label: t('tabs.rooms'),
      content: <Rooms institutionId={institutionId} />,
    },
    ...(can('institution:read')
      ? [
          {
            key: 'terms' as const,
            label: t('tabs.terms'),
            content: <AcademicTerms institutionId={institutionId} />,
          },
        ]
      : []),
  ];

  return (
    <PageShell width="detail">
      <PageHeader title={t('title')} description={t('subtitle')} />
      {isPending ? null : <PageTabs tabs={tabs} label={t('title')} />}
    </PageShell>
  );
}
