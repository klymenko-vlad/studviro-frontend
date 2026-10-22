import { getTranslations } from 'next-intl/server';

import { PersonDirectoryTable } from '@/widgets/person-directory-table';
import { Card, CardContent, PageHeader, PageShell } from '@/shared/ui';

export async function InstitutionPeopleView({
  institutionId,
}: {
  institutionId: string;
}) {
  const t = await getTranslations('people');

  return (
    <PageShell width="detail">
      <PageHeader title={t('title')} description={t('subtitle')} />

      <Card>
        <CardContent>
          <PersonDirectoryTable institutionId={institutionId} />
        </CardContent>
      </Card>
    </PageShell>
  );
}
