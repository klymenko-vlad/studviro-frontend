'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { PageTrail } from '@/widgets/page-trail';
import { ProgramMembers } from '@/widgets/program-members';
import { catalogueQueries } from '@/entities/catalogue';
import { useTerminology } from '@/entities/institution-configuration';
import { institutionRoutes } from '@/shared/config';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  PageShell,
  Skeleton,
} from '@/shared/ui';

export function InstitutionProgramView({
  institutionId,
  programId,
}: {
  institutionId: string;
  programId: string;
}) {
  const t = useTranslations('programMembers');
  const catalogue = useTranslations('catalogue');
  const term = useTerminology(institutionId);
  const programs = useQuery(catalogueQueries.programs({ path: { institutionId } }));
  const program = programs.data?.find(candidate => candidate.id === programId);
  const nav = useTranslations('nav');
  const hubs = useTranslations('hubs.offer');
  const routes = institutionRoutes(institutionId);

  return (
    <PageShell width="detail">
      <PageTrail
        crumbs={[
          { label: nav('offer'), href: routes.offer },
          { label: hubs('tabs.catalogue'), href: routes.catalogue },
        ]}
        current={program?.name}
      />

      {programs.isPending ? (
        <Skeleton className="h-16 w-full" data-testid="program-loading" />
      ) : program === undefined ? (
        <Alert>
          <AlertTitle>{t('notFoundTitle')}</AlertTitle>
          <AlertDescription>{t('notFoundDescription')}</AlertDescription>
        </Alert>
      ) : (
        <>
          <header className="flex flex-col gap-2">
            <h1 className="type-title">{program.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground font-mono text-xs">
                {program.code}
              </span>
              <Badge variant="outline">{term('program')}</Badge>
              <Badge variant="secondary">
                {catalogue(`degreeLevel.${program.degreeLevel}`)}
              </Badge>
              <Badge variant="outline">
                {catalogue(`studyForm.${program.studyForm}`)}
              </Badge>
            </div>
          </header>

          <ProgramMembers institutionId={institutionId} programId={programId} />
        </>
      )}
    </PageShell>
  );
}
