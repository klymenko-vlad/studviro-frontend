'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';

import { discussionQueries, type DiscussionAddress } from '@/entities/discussion';
import { Badge, EmptyState, ListSkeleton, QueryError } from '@/shared/ui';

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
    <ul className="divide-border flex flex-col divide-y" aria-label={t('title')}>
      {data.threads.map(thread => (
        <li key={thread.id} className="flex flex-col gap-1 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="text-left font-medium hover:underline focus-visible:underline"
              onClick={() => {
                onOpen(thread.id);
              }}
            >
              {thread.title === '' ? t('untitled') : thread.title}
            </button>
            {thread.hidden ? <Badge variant="secondary">{t('hiddenBadge')}</Badge> : null}
          </div>
          <p className="text-muted-foreground text-xs">
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
          </p>
        </li>
      ))}
    </ul>
  );
}
