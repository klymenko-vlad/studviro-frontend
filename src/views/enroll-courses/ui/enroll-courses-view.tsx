'use client';

import { useTranslations } from 'next-intl';

import { EnrollableCourses } from '@/widgets/enrollable-courses';
import { usePermissions } from '@/entities/permission';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui';

export function EnrollCoursesView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('enrollment');
  const { can, isPending } = usePermissions(institutionId);

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12"
    >
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-pretty">{t('subtitle')}</p>
      </header>

      {isPending ? null : can('offering:read') ? (
        <EnrollableCourses institutionId={institutionId} />
      ) : (
        <Alert>
          <AlertTitle>{t('deniedTitle')}</AlertTitle>
          <AlertDescription>{t('deniedDescription')}</AlertDescription>
        </Alert>
      )}
    </main>
  );
}
