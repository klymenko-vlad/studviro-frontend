'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import {
  groupTeachingByTerm,
  teachingOfferingQueries,
} from '@/entities/teaching-offering';
import { EmptyState, ListSkeleton, QueryError } from '@/shared/ui';

import { TeachingTermSection } from './teaching-term-section';

export function MyTeaching({ institutionId }: { institutionId: string }) {
  const t = useTranslations('myTeaching');
  const { data, isPending, isError, refetch } = useQuery(
    teachingOfferingQueries.list({ path: { institutionId } }),
  );

  if (isPending) return <ListSkeleton items={3} data-testid="my-teaching-loading" />;

  if (isError) {
    return (
      <QueryError
        onRetry={refetch}
        title={t('errorTitle')}
        description={t('errorDescription')}
      />
    );
  }

  const groups = groupTeachingByTerm(data);

  if (groups.length === 0) {
    return <EmptyState size="inline" title={t('empty')} />;
  }

  return (
    <div className="flex flex-col gap-10">
      {groups.map(group => (
        <TeachingTermSection
          key={group.term.id}
          group={group}
          institutionId={institutionId}
        />
      ))}
    </div>
  );
}
