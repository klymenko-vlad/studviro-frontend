'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  DiscussionPostEntry,
  ReplyForm,
  ThreadTitle,
  ThreadVisibilityToggle,
} from '@/features/discuss-course';
import { discussionQueries, type DiscussionAddress } from '@/entities/discussion';
import { toApiError } from '@/shared/api';
import { Alert, AlertDescription, Button, ListSkeleton, QueryError } from '@/shared/ui';

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
            !data.hidden &&
            data.posts.some(post => post.mine && post.author.id === data.author.id)
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

      <div className="flex flex-col">
        {data.posts.map(post => (
          <DiscussionPostEntry
            key={post.id}
            address={address}
            threadId={threadId}
            post={post}
            canModerate={data.canModerate}
          />
        ))}
      </div>

      {data.hidden ? null : <ReplyForm address={address} threadId={threadId} />}
    </div>
  );
}
