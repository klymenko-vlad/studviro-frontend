'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';

import { discussionQueries, type DiscussionAddress } from '@/entities/discussion';
import {
  Badge,
  EmptyState,
  LinkRow,
  LinkRowChevron,
  ListSkeleton,
  QueryError,
} from '@/shared/ui';

export function DiscussionThreadList({
  address,
  onOpen,
}: {
  address: DiscussionAddress;
  onOpen: (threadId: string) => void;
}) {
  const t = useTranslations('discussion');
  const format = useFormatter();
  const { data, isPending, isError, refetch } = useQuery(
    discussionQueries.threads({ path: address }),
  );

  if (isPending) return <ListSkeleton />;
  if (isError) {
    return (
      <QueryError
        title={t('error')}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }
  if (data.threads.length === 0) return <EmptyState size="inline" title={t('empty')} />;

  return (
    <ul className="-mx-2 flex flex-col" aria-label={t('title')}>
      {data.threads.map(thread => (
        <li key={thread.id}>
          <LinkRow asChild className="items-start py-3 text-left">
            <button
              type="button"
              aria-labelledby={`thread-${thread.id}-title`}
              aria-describedby={`thread-${thread.id}-meta`}
              onClick={() => {
                onOpen(thread.id);
              }}
              className="w-full"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span id={`thread-${thread.id}-title`} className="font-medium">
                    {thread.title === '' ? t('untitled') : thread.title}
                  </span>
                  {thread.hidden ? (
                    <Badge variant="secondary">{t('hiddenBadge')}</Badge>
                  ) : null}
                </span>
                <span
                  id={`thread-${thread.id}-meta`}
                  className="text-muted-foreground text-xs"
                >
                  {t('threadMeta', {
                    name: thread.author.displayName,
                    count: thread.postCount,
                    date: format.dateTime(new Date(thread.lastActivityAt), {
                      day: 'numeric',
                      month: 'short',
                      hour: 'numeric',
                      minute: 'numeric',
                    }),
                  })}
                </span>
              </span>
              <span className="self-center">
                <LinkRowChevron />
              </span>
            </button>
          </LinkRow>
        </li>
      ))}
    </ul>
  );
}
