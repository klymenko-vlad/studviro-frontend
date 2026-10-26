'use client';

import { useState } from 'react';
import { Reply } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  DiscussionPostItem,
  type DiscussionAddress,
  type DiscussionPost,
} from '@/entities/discussion';
import { Button } from '@/shared/ui';

import { AttachmentLinks } from './attachment-links';
import { EditPostForm } from './edit-post-form';
import { PostActions } from './post-actions';

/** One post with what the reader may do to it, editing in place for its author. */
export function DiscussionPostEntry({
  address,
  threadId,
  post,
  canModerate,
  onReply,
}: {
  address: DiscussionAddress;
  threadId: string;
  post: DiscussionPost;
  canModerate: boolean;
  onReply?: () => void;
}) {
  const t = useTranslations('discussion');
  const [editing, setEditing] = useState(false);
  const stopEditing = () => {
    setEditing(false);
  };

  return (
    <DiscussionPostItem
      post={post}
      files={<AttachmentLinks address={address} threadId={threadId} post={post} />}
      editor={
        editing ? (
          <EditPostForm
            address={address}
            threadId={threadId}
            post={post}
            onDone={stopEditing}
          />
        ) : undefined
      }
      actions={
        editing ? undefined : (
          <>
            {onReply === undefined || post.state !== 'visible' ? null : (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label={t('replyTo', { name: post.author.displayName })}
                onClick={onReply}
              >
                <Reply aria-hidden />
                {t('replyAction')}
              </Button>
            )}
            <PostActions
              address={address}
              threadId={threadId}
              post={post}
              canModerate={canModerate}
              onEdit={() => {
                setEditing(true);
              }}
            />
          </>
        )
      }
    />
  );
}
