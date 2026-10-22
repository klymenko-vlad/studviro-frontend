'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { enrolledCourseQueries, splitByTime } from '@/entities/enrolled-course';
import { institutionRoutes, Link } from '@/shared/config';
import { Button, EmptyState, ListSkeleton, QueryError } from '@/shared/ui';

import { EarlierCourses } from './earlier-courses';
import { TermSection } from './term-section';

export function MyCourses({
  institutionId,
  today,
}: {
  institutionId: string;
  today?: Date;
}) {
  const t = useTranslations('myCourses');
  const { data, isPending, isError, refetch } = useQuery(
    enrolledCourseQueries.list({ path: { institutionId } }),
  );
  const [now] = useState(() => today ?? new Date());

  if (isPending) return <ListSkeleton items={3} data-testid="my-courses-loading" />;

  if (isError) {
    return (
      <QueryError
        onRetry={refetch}
        title={t('errorTitle')}
        description={t('errorDescription')}
      />
    );
  }

  const { current, earlier } = splitByTime(data, now);

  if (current.length === 0 && earlier.length === 0) {
    return <EmptyState size="inline" title={t('empty')} />;
  }

  return (
    <div className="flex flex-col gap-10">
      {current.length === 0 ? (
        <EmptyState
          size="inline"
          title={t('noCurrent')}
          action={
            <Button asChild variant="outline" size="sm">
              <Link href={institutionRoutes(institutionId).enroll}>
                {t('findCourses')}
              </Link>
            </Button>
          }
        />
      ) : (
        current.map(group => (
          <TermSection key={group.term.id} group={group} institutionId={institutionId} />
        ))
      )}

      {earlier.length === 0 ? null : (
        <EarlierCourses groups={earlier} institutionId={institutionId} />
      )}
    </div>
  );
}
