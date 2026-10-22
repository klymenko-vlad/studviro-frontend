'use client';

import { useTranslations } from 'next-intl';

import { AcademicTerms } from '@/widgets/academic-terms';
import { Catalogue } from '@/widgets/catalogue';
import { CourseOfferings } from '@/widgets/course-offerings';
import { usePermissions } from '@/entities/permission';
import { Alert, AlertDescription, AlertTitle, PageHeader, PageShell } from '@/shared/ui';

export function InstitutionCatalogueView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('catalogue');
  const { can, isPending } = usePermissions(institutionId);

  return (
    <PageShell>
      <PageHeader title={t('title')} description={t('subtitle')} />

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
    </PageShell>
  );
}
