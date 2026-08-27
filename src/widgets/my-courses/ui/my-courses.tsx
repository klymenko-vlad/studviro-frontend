'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { enrolledCourseQueries, groupByTerm } from '@/entities/enrolled-course';
import { Alert, AlertDescription, AlertTitle, Skeleton } from '@/shared/ui';

import { TermSection } from './term-section';

export function MyCourses({ institutionId }: { institutionId: string }) {
  const t = useTranslations('myCourses');
  const { data, isPending, isError } = useQuery(
    enrolledCourseQueries.list({ path: { institutionId } }),
  );

  if (isPending)
    return <Skeleton className="h-64 w-full" data-testid="my-courses-loading" />;

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('errorTitle')}</AlertTitle>
        <AlertDescription>{t('errorDescription')}</AlertDescription>
      </Alert>
    );
  }

  const groups = groupByTerm(data);

  if (groups.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('empty')}</p>;
  }

  return (
    <div className="flex flex-col gap-10">
      {groups.map(group => (
        <TermSection key={group.term.id} group={group} />
      ))}
    </div>
  );
}
