'use client';

import { useTranslations } from 'next-intl';

import { InstitutionSearch } from '@/features/search';
import { PageHeader, PageShell } from '@/shared/ui';

export function InstitutionSearchView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('search');

  return (
    <PageShell width="prose">
      <PageHeader title={t('title')} description={t('subtitle')} />

      <InstitutionSearch institutionId={institutionId} />
    </PageShell>
  );
}
