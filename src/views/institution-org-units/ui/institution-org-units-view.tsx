import { getTranslations } from 'next-intl/server';

import { OrgUnitTree } from '@/widgets/org-unit-tree';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui';

export async function InstitutionOrgUnitsView({
  institutionId,
}: {
  institutionId: string;
}) {
  const t = await getTranslations('orgUnits');

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-pretty">{t('subtitle')}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <OrgUnitTree institutionId={institutionId} />
        </CardContent>
      </Card>
    </main>
  );
}
