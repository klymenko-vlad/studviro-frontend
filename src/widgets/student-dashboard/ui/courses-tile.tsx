'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';

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
  Skeleton,
} from '@/shared/ui';

const SHOWN = 4;

export function CoursesTile({ institutionId }: { institutionId: string }) {
  const t = useTranslations('dashboard');
  const format = useFormatter();
  const { data, isPending, isError } = useQuery(
    enrolledCourseQueries.list({ path: { institutionId } }),
  );

  const term = isPending || isError ? null : groupByTerm(data)[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('courses.title')}</CardTitle>
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
          <Skeleton className="h-24 w-full" data-testid="dashboard-courses-loading" />
        ) : isError ? (
          <p className="text-destructive text-sm">{t('courses.error')}</p>
        ) : term === null || term === undefined ? (
          <p className="text-muted-foreground text-sm">{t('courses.empty')}</p>
        ) : (
          <>
            <p className="text-sm" data-testid="dashboard-courses-summary">
              {t('courses.summary', {
                courses: term.courses.length,
                credits: totalCredits(term.courses),
              })}
            </p>

            <ul className="flex flex-col gap-1 text-sm">
              {term.courses.slice(0, SHOWN).map(course => (
                <li key={course.enrollmentId} className="flex justify-between gap-4">
                  <span className="truncate">{course.course.title}</span>
                  <span className="text-muted-foreground font-mono text-xs">
                    {course.course.code}
                  </span>
                </li>
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
