'use client';

import { useDeferredValue, useId, useState } from 'react';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { outlineAnchor } from '@/entities/learning-section';
import { studyGroupQueries } from '@/entities/study-group';
import { Link, usePathname } from '@/shared/config';
import { Input, Label, ListSkeleton, LoadMore } from '@/shared/ui';

const PAGE = 10;

export function StudyGroupContent({
  institutionId,
  offeringId,
  groupId,
  code,
}: {
  institutionId: string;
  offeringId: string;
  groupId: string;
  code: string;
}) {
  const t = useTranslations('studyGroups.content');
  const pathname = usePathname();
  const filterId = useId();
  const [filter, setFilter] = useState('');
  const q = useDeferredValue(filter.trim());
  const content = useInfiniteQuery({
    ...studyGroupQueries.content({
      path: { institutionId, offeringId, groupId },
      query: { limit: PAGE, ...(q === '' ? {} : { q }) },
    }),
    placeholderData: keepPreviousData,
  });

  if (content.isPending) return <ListSkeleton items={1} />;
  if (content.isError) {
    return <p className="text-muted-foreground text-sm">{t('error')}</p>;
  }
  const items = content.data.pages.flatMap(page => page.items);
  if (items.length === 0 && filter === '') {
    return <p className="text-muted-foreground text-sm">{t('empty', { code })}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{t('title', { code })}</p>
      <div className="flex flex-col gap-1 sm:max-w-xs">
        <Label htmlFor={filterId} className="text-xs">
          {t('filter', { code })}
        </Label>
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
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('noMatch')}</p>
      ) : null}
      <ul className="flex flex-col gap-1" aria-label={t('title', { code })}>
        {items.map(item => {
          const place =
            item.kind === 'section'
              ? null
              : item.sectionTitle === null
                ? t('general')
                : t('inSection', { title: item.sectionTitle });
          const how = [
            ...(item.via.includes('audience')
              ? [t(item.hideFromOthers ? 'audienceHidden' : 'audienceLocked')]
              : []),
            ...(item.via.includes('condition') ? [t('condition')] : []),
          ];

          return (
            <li key={item.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
              <Link
                href={`${pathname}?section=materials#${outlineAnchor(item.kind, item.id)}`}
                className="underline-offset-4 hover:underline"
              >
                {item.title}
              </Link>
              <span className="text-muted-foreground text-xs">
                {[place, ...how].filter(part => part !== null).join(' · ')}
              </span>
            </li>
          );
        })}
      </ul>
      <LoadMore
        shown={items.length}
        hasMore={content.hasNextPage}
        pending={content.isFetchingNextPage}
        onLoadMore={() => void content.fetchNextPage()}
      />
    </div>
  );
}
