'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';

import { courseOfferingHref } from '@/entities/course-offering';
import {
  enrolledCourseQueries,
  groupByTerm,
  totalCredits,
} from '@/entities/enrolled-course';
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
import { TileLinkRow } from './tile-link-row';

const SHOWN = 4;

export function CoursesTile({ institutionId }: { institutionId: string }) {
  const t = useTranslations('dashboard');
  const heading = useTileHeading();
  const format = useFormatter();
  const { data, isPending, isError, refetch } = useQuery(
    enrolledCourseQueries.list({ path: { institutionId } }),
  );

  const term = isPending || isError ? null : groupByTerm(data)[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle as={heading}>{t('courses.title')}</CardTitle>
        <CardDescription>
          {term === undefined || term === null
            ? t('courses.description')
            : t('courses.term', {
                term: term.term.name,
                starts: format.dateTime(new Date(term.term.startsAt), {
                  dateStyle: 'medium',
                }),
              })}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {isPending ? (
          <ListSkeleton items={2} data-testid="dashboard-courses-loading" />
        ) : isError ? (
          <QueryError title={t('courses.error')} onRetry={refetch} />
        ) : term === null || term === undefined ? (
          <EmptyState size="inline" title={t('courses.empty')} />
        ) : (
          <>
            <p className="text-sm" data-testid="dashboard-courses-summary">
              {t('courses.summary', {
                courses: term.courses.length,
                credits: totalCredits(term.courses),
              })}
            </p>

            <ul className="-mx-2 flex flex-col">
              {term.courses.slice(0, SHOWN).map(course => (
                <TileLinkRow
                  key={course.enrollmentId}
                  href={courseOfferingHref(institutionId, course.offering.id)}
                  code={course.course.code}
                  title={course.course.title}
                  figure={course.course.code}
                />
              ))}
            </ul>

            {term.courses.length > SHOWN ? (
              <p className="text-muted-foreground text-xs">
                {t('courses.more', { count: term.courses.length - SHOWN })}
              </p>
            ) : null}
          </>
        )}

        <Button asChild variant="outline" size="sm" className="self-start">
          <Link href={`/institutions/${institutionId}/courses`}>{t('courses.link')}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
