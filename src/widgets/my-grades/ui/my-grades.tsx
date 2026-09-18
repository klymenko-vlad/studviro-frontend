'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { courseResultQueries, groupResultsByTerm } from '@/entities/course-result';
import { Alert, AlertDescription, AlertTitle, Skeleton } from '@/shared/ui';

import { TermResultsSection } from './term-results-section';

export function MyGrades({ institutionId }: { institutionId: string }) {
  const t = useTranslations('grades');
  const { data, isPending, isError } = useQuery(
    courseResultQueries.list({ path: { institutionId } }),
  );
  const summary = useQuery(courseResultQueries.summary({ path: { institutionId } }));

  if (isPending)
    return <Skeleton className="h-64 w-full" data-testid="my-grades-loading" />;

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('errorTitle')}</AlertTitle>
        <AlertDescription>{t('errorDescription')}</AlertDescription>
      </Alert>
    );
  }

  const groups = groupResultsByTerm(data);

  if (groups.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('empty')}</p>;
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
