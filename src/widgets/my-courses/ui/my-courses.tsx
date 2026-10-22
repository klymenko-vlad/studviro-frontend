'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { enrolledCourseQueries, groupByTerm } from '@/entities/enrolled-course';
import { EmptyState, ListSkeleton, QueryError } from '@/shared/ui';

import { TermSection } from './term-section';

export function MyCourses({ institutionId }: { institutionId: string }) {
  const t = useTranslations('myCourses');
  const { data, isPending, isError, refetch } = useQuery(
    enrolledCourseQueries.list({ path: { institutionId } }),
  );

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

  const groups = groupByTerm(data);

  if (groups.length === 0) {
    return <EmptyState size="inline" title={t('empty')} />;
  }

  return (
    <div className="flex flex-col gap-10">
      {groups.map(group => (
        <TermSection key={group.term.id} group={group} institutionId={institutionId} />
      ))}
    </div>
  );
}
