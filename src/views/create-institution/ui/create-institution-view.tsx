import { getTranslations } from 'next-intl/server';

import { CreateInstitutionForm } from '@/features/create-institution';
import { Card, CardContent } from '@/shared/ui';

export async function CreateInstitutionView() {
  const t = await getTranslations('createInstitution');

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-6 py-12"
    >
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t('pageTitle')}</h1>
        <p className="text-muted-foreground text-pretty">{t('pageDescription')}</p>
      </header>

      <Card>
        <CardContent>
          <CreateInstitutionForm />
        </CardContent>
      </Card>
    </main>
  );
}
