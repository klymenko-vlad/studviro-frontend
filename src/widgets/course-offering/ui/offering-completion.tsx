'use client';

import { useDeferredValue, useId, useState } from 'react';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { completionQueries } from '@/entities/completion';
import { learningSpaceQueries, spaceForOffering } from '@/entities/learning-space';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Label,
  ListSkeleton,
  LoadMore,
  QueryError,
  TableSkeleton,
} from '@/shared/ui';

import { CompletionTable } from './completion-table';

const PAGE = 25;

export function OfferingCompletion({
  institutionId,
  offeringId,
}: {
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('completion.report');
  const spaces = useQuery(
    learningSpaceQueries.list({ path: { institutionId }, query: { offeringId } }),
  );
  const space =
    spaces.data === undefined ? null : spaceForOffering(spaces.data, offeringId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {spaces.isPending ? (
          <ListSkeleton items={2} data-testid="offering-completion-loading" />
        ) : space === null ? (
          <EmptyState size="inline" title={t('noSpace')} />
        ) : (
          <CompletionReport institutionId={institutionId} spaceId={space.id} />
        )}
      </CardContent>
    </Card>
  );
}

function CompletionReport({
  institutionId,
  spaceId,
}: {
  institutionId: string;
  spaceId: string;
}) {
  const t = useTranslations('completion.report');
  const filterId = useId();
  const [filter, setFilter] = useState('');
  const q = useDeferredValue(filter.trim());

  const report = useInfiniteQuery({
    ...completionQueries.report({
      path: { institutionId, spaceId },
      query: { limit: PAGE, ...(q === '' ? {} : { q }) },
    }),
    placeholderData: keepPreviousData,
  });

  if (report.isPending)
    return <TableSkeleton rows={4} data-testid="completion-loading" />;
  if (report.isError) {
    return (
      <QueryError
        onRetry={() => void report.refetch()}
        title={t('errorTitle')}
        description={t('errorDescription')}
      />
    );
  }

  const columns = report.data.pages[0]?.columns ?? [];
  const students = report.data.pages.flatMap(page => page.items);

  if (columns.length === 0)
    return <EmptyState size="inline" title={t('nothingTracked')} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:max-w-xs">
        <Label htmlFor={filterId}>{t('filter')}</Label>
        <Input
          id={filterId}
          type="search"
          autoComplete="off"
          placeholder={t('filterPlaceholder')}
          value={filter}
          onChange={event => {
            setFilter(event.target.value);
          }}
        />
      </div>

      {students.length === 0 ? (
        <EmptyState size="inline" title={t('empty')} />
      ) : (
        <CompletionTable columns={columns} students={students} />
      )}

      <LoadMore
        shown={students.length}
        hasMore={report.hasNextPage}
        pending={report.isFetchingNextPage}
        onLoadMore={() => void report.fetchNextPage()}
      />
    </div>
  );
}
