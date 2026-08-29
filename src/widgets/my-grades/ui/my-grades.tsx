'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import {
  courseResultQueries,
  creditsEarned,
  groupResultsByTerm,
  weightedAverage,
} from '@/entities/course-result';
import { Alert, AlertDescription, AlertTitle, Skeleton } from '@/shared/ui';

import { TermResultsSection } from './term-results-section';

export function MyGrades({ institutionId }: { institutionId: string }) {
  const t = useTranslations('grades');
  const { data, isPending, isError } = useQuery(
    courseResultQueries.list({ path: { institutionId } }),
  );

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

  const average = weightedAverage(data);

  return (
    <div className="flex flex-col gap-10">
      <p className="text-muted-foreground text-sm" data-testid="my-grades-summary">
        {average === null
          ? t('overviewWithoutAverage', { credits: creditsEarned(data) })
          : t('overview', {
              credits: creditsEarned(data),
              average: average.toFixed(2),
            })}
      </p>

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
