'use client';

import { useTranslations } from 'next-intl';

import { AcademicTerms } from '@/widgets/academic-terms';
import { Catalogue } from '@/widgets/catalogue';
import { CourseOfferings } from '@/widgets/course-offerings';
import { usePermissions } from '@/entities/permission';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui';

export function InstitutionCatalogueView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('catalogue');
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

      {isPending ? null : can('course:read') ? (
        <div className="flex flex-col gap-8">
          {can('institution:read') ? (
            <AcademicTerms institutionId={institutionId} />
          ) : null}
          <Catalogue institutionId={institutionId} />
          {can('offering:read') ? (
            <CourseOfferings institutionId={institutionId} />
          ) : null}
        </div>
      ) : (
        <Alert>
          <AlertTitle>{t('deniedTitle')}</AlertTitle>
          <AlertDescription>{t('deniedDescription')}</AlertDescription>
        </Alert>
      )}
    </main>
  );
}
