'use client';

import { useTranslations } from 'next-intl';

import { BulkEntry } from '@/widgets/bulk-entry';
import { usePermissions } from '@/entities/permission';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui';

export function InstitutionBulkView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('bulkEntry');
  const { can, isPending } = usePermissions(institutionId);
  const allowed = can('offering:manage') || can('program:manage');

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-pretty">{t('subtitle')}</p>
      </header>

      {isPending ? null : allowed ? (
        <BulkEntry institutionId={institutionId} />
      ) : (
        <Alert>
          <AlertTitle>{t('deniedTitle')}</AlertTitle>
          <AlertDescription>{t('deniedDescription')}</AlertDescription>
        </Alert>
      )}
    </main>
  );
}
