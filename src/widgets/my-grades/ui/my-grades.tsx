'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { courseResultQueries, groupResultsByTerm } from '@/entities/course-result';
import { EmptyState, ListSkeleton, QueryError } from '@/shared/ui';

import { ProgrammeStandingCard } from './programme-standing';
import { TermResultsSection } from './term-results-section';

export function MyGrades({ institutionId }: { institutionId: string }) {
  const t = useTranslations('grades');
  const { data, isPending, isError, refetch } = useQuery(
    courseResultQueries.list({ path: { institutionId } }),
  );
  const summary = useQuery(courseResultQueries.summary({ path: { institutionId } }));

  if (isPending) return <ListSkeleton items={3} data-testid="my-grades-loading" />;

  if (isError) {
    return (
      <QueryError
        onRetry={refetch}
        title={t('errorTitle')}
        description={t('errorDescription')}
      />
    );
  }

  const groups = groupResultsByTerm(data);

  if (groups.length === 0) {
    return <EmptyState size="inline" title={t('empty')} />;
  }

  const progress = summary.data ?? null;

  return (
    <div className="flex flex-col gap-10">
      {progress === null ? null : (
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-sm" data-testid="my-grades-summary">
            {progress.weightedAverage === null
              ? t('overviewWithoutAverage', { credits: progress.creditsEarned })
              : t('overview', {
                  credits: progress.creditsEarned,
                  average: progress.weightedAverage.toFixed(2),
                })}
          </p>
          {progress.awaitingRetake === 0 ? null : (
            <p className="text-destructive text-sm" data-testid="my-grades-retakes">
              {t('awaitingRetake', { courses: progress.awaitingRetake })}
            </p>
          )}
        </div>
      )}

      {progress === null || progress.programmes.length === 0 ? null : (
        <div className="flex flex-col gap-3" data-testid="my-grades-standing">
          <h2 className="text-lg font-semibold tracking-tight">{t('standing.title')}</h2>
          {progress.programmes.map(standing => (
            <ProgrammeStandingCard key={standing.programId} standing={standing} />
          ))}
        </div>
      )}

      {groups.map(group => (
        <TermResultsSection
          key={group.term.id}
          group={group}
          institutionId={institutionId}
        />
      ))}
    </div>
  );
}
