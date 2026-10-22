'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { courseResultQueries, isPublished } from '@/entities/course-result';
import { Link } from '@/shared/config';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ListSkeleton,
  QueryError,
} from '@/shared/ui';

import { useTileHeading } from './tile-heading';

const SHOWN = 4;

export function GradesTile({ institutionId }: { institutionId: string }) {
  const t = useTranslations('dashboard');
  const heading = useTileHeading();
  const { data, isPending, isError, refetch } = useQuery(
    courseResultQueries.list({ path: { institutionId } }),
  );

  const summary = useQuery(courseResultQueries.summary({ path: { institutionId } }));
  const progress = summary.data ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle as={heading}>{t('grades.title')}</CardTitle>
        <CardDescription>{t('grades.description')}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {isPending ? (
          <ListSkeleton items={2} data-testid="dashboard-grades-loading" />
        ) : isError ? (
          <QueryError title={t('grades.error')} onRetry={refetch} />
        ) : data.length === 0 ? (
          <EmptyState size="inline" title={t('grades.empty')} />
        ) : (
          <>
            {progress === null ? null : (
              <p className="text-sm" data-testid="dashboard-grades-summary">
                {progress.weightedAverage === null
                  ? t('grades.summaryWithoutAverage', { credits: progress.creditsEarned })
                  : t('grades.summary', {
                      credits: progress.creditsEarned,
                      average: progress.weightedAverage.toFixed(2),
                    })}
              </p>
            )}

            <ul className="flex flex-col gap-1 text-sm">
              {data.slice(0, SHOWN).map(result => (
                <li key={result.id} className="flex justify-between gap-4">
                  <span className="truncate">{result.course.title}</span>
                  <span className="text-muted-foreground text-xs">
                    {result.effective === null
                      ? t('grades.pending')
                      : t(`grade.${result.effective.grade}`)}
                  </span>
                </li>
              ))}
            </ul>

            <p className="text-muted-foreground text-xs">
              {t('grades.published', {
                published: data.filter(isPublished).length,
                total: data.length,
              })}
            </p>
          </>
        )}

        <Button asChild variant="outline" size="sm" className="self-start">
          <Link href={`/institutions/${institutionId}/grades`}>{t('grades.link')}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
