import { getTranslations } from 'next-intl/server';

import { CreateInstitutionForm } from '@/features/create-institution';
import { Card, CardContent, PageHeader, PageShell } from '@/shared/ui';

export async function CreateInstitutionView() {
  const t = await getTranslations('createInstitution');

  return (
    <PageShell width="form">
      <PageHeader title={t('pageTitle')} description={t('pageDescription')} />

      <Card>
        <CardContent>
          <CreateInstitutionForm />
        </CardContent>
      </Card>
    </PageShell>
  );
}
