'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { ProgramMembers } from '@/widgets/program-members';
import { catalogueQueries } from '@/entities/catalogue';
import { Alert, AlertDescription, AlertTitle, Badge, Skeleton } from '@/shared/ui';

export function InstitutionProgramView({
  institutionId,
  programId,
}: {
  institutionId: string;
  programId: string;
}) {
  const t = useTranslations('programMembers');
  const catalogue = useTranslations('catalogue');
  const programs = useQuery(catalogueQueries.programs({ path: { institutionId } }));
  const program = programs.data?.find(candidate => candidate.id === programId);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
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
            <h1 className="text-3xl font-semibold tracking-tight">{program.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground font-mono text-xs">
                {program.code}
              </span>
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
    </main>
  );
}
