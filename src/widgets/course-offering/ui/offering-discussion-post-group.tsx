'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { DiscussionPostEntry, ReplyForm } from '@/features/discuss-course';
import {
  discussionQueries,
  type DiscussionAddress,
  type DiscussionPost,
} from '@/entities/discussion';
import { Button, ListSkeleton, LoadMore } from '@/shared/ui';

/**
 * A top-level post and the replies gathered under it, folded away until asked
 * for. Answering any post here opens one reply form at the foot of the group.
 */
export function DiscussionPostGroup({
  address,
  threadId,
  post,
  canModerate,
  canReply,
}: {
  address: DiscussionAddress;
  threadId: string;
  post: DiscussionPost;
  canModerate: boolean;
  canReply: boolean;
}) {
  const t = useTranslations('discussion');
  const [open, setOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<DiscussionPost | null>(null);
  const answer = canReply
    ? (target: DiscussionPost) => () => {
        setOpen(true);
        setReplyTo(target);
      }
    : undefined;

  return (
    <div className="border-border border-b last:border-b-0">
      <DiscussionPostEntry
        address={address}
        threadId={threadId}
        post={post}
        canModerate={canModerate}
        onReply={answer?.(post)}
      />

      {post.replyCount === 0 && replyTo === null ? null : (
        <div className="border-border mb-4 ml-3 flex flex-col border-l pl-4 sm:ml-5">
          {post.replyCount === 0 ? null : (
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-expanded={open}
                onClick={() => {
                  setOpen(!open);
                }}
              >
                {open ? <ChevronDown aria-hidden /> : <ChevronRight aria-hidden />}
                {t('replyCount', { count: post.replyCount })}
              </Button>
            </div>
          )}

          {open && post.replyCount > 0 ? (
            <Replies
              address={address}
              threadId={threadId}
              parentId={post.id}
              canModerate={canModerate}
              onReply={answer}
            />
          ) : null}

          {replyTo === null ? null : (
            <div className="pt-2 pb-1">
              <ReplyForm
                key={replyTo.id}
                address={address}
                threadId={threadId}
                replyTo={replyTo}
                onDone={() => {
                  setReplyTo(null);
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Replies({
  address,
  threadId,
  parentId,
  canModerate,
  onReply,
}: {
  address: DiscussionAddress;
  threadId: string;
  parentId: string;
  canModerate: boolean;
  onReply: ((target: DiscussionPost) => () => void) | undefined;
}) {
  const t = useTranslations('discussion');
  const replies = useInfiniteQuery(
    discussionQueries.replies({ path: { ...address, threadId, postId: parentId } }),
  );
  const items = replies.data?.pages.flatMap(page => page.items) ?? [];

  if (replies.isPending) return <ListSkeleton items={2} />;
  if (replies.isError) {
    return <p className="text-muted-foreground py-2 text-sm">{t('repliesError')}</p>;
  }

  return (
    <div className="flex flex-col">
      {items.map(reply => (
        <DiscussionPostEntry
          key={reply.id}
          address={address}
          threadId={threadId}
          post={reply}
          canModerate={canModerate}
          onReply={onReply?.(reply)}
        />
      ))}
      {replies.hasNextPage ? (
        <LoadMore
          shown={items.length}
          hasMore={replies.hasNextPage}
          pending={replies.isFetchingNextPage}
          onLoadMore={() => {
            void replies.fetchNextPage();
          }}
        />
      ) : null}
    </div>
  );
}
