'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  ReplyForm,
  ThreadTitle,
  ThreadVisibilityToggle,
} from '@/features/discuss-course';
import { discussionQueries, type DiscussionAddress } from '@/entities/discussion';
import { toApiError } from '@/shared/api';
import {
  Alert,
  AlertDescription,
  Button,
  ListSkeleton,
  LoadMore,
  QueryError,
} from '@/shared/ui';

import { DiscussionPostGroup } from './offering-discussion-post-group';

export function DiscussionThreadView({
  address,
  threadId,
  onBack,
}: {
  address: DiscussionAddress;
  threadId: string;
  onBack: () => void;
}) {
  const t = useTranslations('discussion');
  const { data, isPending, error, refetch } = useQuery(
    discussionQueries.thread({ path: { ...address, threadId } }),
  );
  const posts = useInfiniteQuery(
    discussionQueries.posts({ path: { ...address, threadId } }),
  );
  const items = posts.data?.pages.flatMap(page => page.items) ?? [];
  const opening = items[0];

  const back = (
    <div>
      <Button type="button" variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft aria-hidden />
        {t('back')}
      </Button>
    </div>
  );

  if (isPending) return <ListSkeleton />;
  if (error) {
    return (
      <>
        {back}
        {toApiError(error).status === 404 ? (
          <Alert>
            <AlertDescription>{t('notFound')}</AlertDescription>
          </Alert>
        ) : (
          <QueryError
            title={t('error')}
            onRetry={() => {
              void refetch();
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {back}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ThreadTitle
          address={address}
          threadId={threadId}
          title={data.title}
          canRename={
            !data.hidden && opening?.mine === true && opening.author.id === data.author.id
          }
        />
        {data.canModerate ? (
          <ThreadVisibilityToggle
            address={address}
            threadId={threadId}
            hidden={data.hidden}
          />
        ) : null}
      </div>

      {data.hidden ? (
        <Alert>
          <AlertDescription>{t('hiddenThreadNotice')}</AlertDescription>
        </Alert>
      ) : null}

      {posts.isPending ? (
        <ListSkeleton />
      ) : posts.isError ? (
        <QueryError
          title={t('error')}
          onRetry={() => {
            void posts.refetch();
          }}
        />
      ) : (
        <div className="flex flex-col">
          {items.map(post => (
            <DiscussionPostGroup
              key={post.id}
              address={address}
              threadId={threadId}
              post={post}
              canModerate={data.canModerate}
              canReply={!data.hidden}
            />
          ))}
          {posts.hasNextPage ? (
            <LoadMore
              shown={items.length}
              hasMore={posts.hasNextPage}
              pending={posts.isFetchingNextPage}
              onLoadMore={() => {
                void posts.fetchNextPage();
              }}
            />
          ) : null}
        </div>
      )}

      {data.hidden ? null : <ReplyForm address={address} threadId={threadId} />}
    </div>
  );
}
