'use client';

import { useDeferredValue, useId, useState } from 'react';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import type { ImportSourceDto } from '@/shared/api';
import { Badge, Button, Input, Label, ListSkeleton, LoadMore } from '@/shared/ui';

import { importCourseQueries } from '../api/import-course-queries';

const PAGE = 10;

export function ImportSourcePicker({
  institutionId,
  spaceId,
  onChoose,
}: {
  institutionId: string;
  spaceId: string;
  onChoose: (source: ImportSourceDto) => void;
}) {
  const t = useTranslations('courseImport');
  const filterId = useId();
  const [filter, setFilter] = useState('');
  const q = useDeferredValue(filter.trim());

  const sources = useInfiniteQuery({
    ...importCourseQueries.sources({
      path: { institutionId, spaceId },
      query: { limit: PAGE, ...(q === '' ? {} : { q }) },
    }),
    placeholderData: keepPreviousData,
  });
  const rows = sources.data?.pages.flatMap(page => page.items) ?? [];

  return (
    <div className="flex flex-col gap-3">
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

      {sources.isPending ? (
        <ListSkeleton items={2} />
      ) : sources.isError ? (
        <p className="text-muted-foreground text-sm">{t('sourcesError')}</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('empty')}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {rows.map(source => (
            <li key={source.spaceId}>
              <Button
                type="button"
                variant="ghost"
                className="h-auto w-full justify-start py-2 text-left whitespace-normal"
                onClick={() => {
                  onChoose(source);
                }}
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span>{source.name}</span>
                    {source.sameCourse ? (
                      <Badge variant="secondary">{t('sameCourse')}</Badge>
                    ) : null}
                    {source.published ? null : (
                      <Badge variant="outline">{t('unpublished')}</Badge>
                    )}
                  </span>
                  <span className="text-muted-foreground text-xs font-normal">
                    {t('sourceTerm', { term: source.termName, code: source.courseCode })}
                  </span>
                </span>
              </Button>
            </li>
          ))}
        </ul>
      )}

      <LoadMore
        shown={rows.length}
        hasMore={sources.hasNextPage}
        pending={sources.isFetchingNextPage}
        onLoadMore={() => void sources.fetchNextPage()}
      />
    </div>
  );
}
