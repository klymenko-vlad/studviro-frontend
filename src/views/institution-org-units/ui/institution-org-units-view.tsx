import { getTranslations } from 'next-intl/server';

import { OrgUnitTree } from '@/widgets/org-unit-tree';
import { Rooms } from '@/widgets/rooms';
import { Card, CardContent, PageHeader, PageShell } from '@/shared/ui';

export async function InstitutionOrgUnitsView({
  institutionId,
}: {
  institutionId: string;
}) {
  const t = await getTranslations('orgUnits');

  return (
    <PageShell width="detail">
      <PageHeader title={t('title')} description={t('subtitle')} />

      <Card>
        <CardContent>
          <OrgUnitTree institutionId={institutionId} />
        </CardContent>
      </Card>

      <Rooms institutionId={institutionId} />
    </PageShell>
  );
}
