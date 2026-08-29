'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import {
  groupTeachingByTerm,
  teachingOfferingQueries,
} from '@/entities/teaching-offering';
import { Alert, AlertDescription, AlertTitle, Skeleton } from '@/shared/ui';

import { TeachingTermSection } from './teaching-term-section';

export function MyTeaching({ institutionId }: { institutionId: string }) {
  const t = useTranslations('myTeaching');
  const { data, isPending, isError } = useQuery(
    teachingOfferingQueries.list({ path: { institutionId } }),
  );

  if (isPending)
    return <Skeleton className="h-64 w-full" data-testid="my-teaching-loading" />;

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('errorTitle')}</AlertTitle>
        <AlertDescription>{t('errorDescription')}</AlertDescription>
      </Alert>
    );
  }

  const groups = groupTeachingByTerm(data);

  if (groups.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('empty')}</p>;
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
