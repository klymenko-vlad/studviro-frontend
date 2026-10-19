'use client';

import { useState } from 'react';

import {
  DiscussionPostItem,
  type DiscussionAddress,
  type DiscussionPost,
} from '@/entities/discussion';

import { AttachmentLinks } from './attachment-links';
import { EditPostForm } from './edit-post-form';
import { PostActions } from './post-actions';

/** One post with what the reader may do to it, editing in place for its author. */
export function DiscussionPostEntry({
  address,
  threadId,
  post,
  canModerate,
}: {
  address: DiscussionAddress;
  threadId: string;
  post: DiscussionPost;
  canModerate: boolean;
}) {
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
          <PostActions
            address={address}
            threadId={threadId}
            post={post}
            canModerate={canModerate}
            onEdit={() => {
              setEditing(true);
            }}
          />
        )
      }
    />
  );
}
