'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  discussionMutations,
  type DiscussionAddress,
  type DiscussionPost,
} from '@/entities/discussion';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

import { useRefreshDiscussion } from '../model/use-refresh-discussion';

/**
 * Deleting is the author's and cannot be undone, so it asks twice; hiding is
 * the moderator's and can be, so it does not.
 */
export function PostActions({
  address,
  threadId,
  post,
  canModerate,
  onEdit,
}: {
  address: DiscussionAddress;
  threadId: string;
  post: DiscussionPost;
  canModerate: boolean;
  onEdit?: () => void;
}) {
  const t = useTranslations('discussion');
  const refresh = useRefreshDiscussion();
  const [confirming, setConfirming] = useState(false);
  const path = { ...address, threadId, postId: post.id };
  const fail = (error: unknown) => toast.error(toApiError(error).message);

  const remove = useMutation({
    ...discussionMutations.deletePost(),
    onSuccess: async () => {
      toast.success(t('deleted'));
      await refresh();
    },
    onError: fail,
  });

  const visibility = useMutation({
    ...discussionMutations.setPostVisibility(),
    onSuccess: async (_, { body }) => {
      toast.success(body.hidden ? t('hiddenDone') : t('restoredDone'));
      await refresh();
    },
    onError: fail,
  });

  if (post.state === 'deleted') return null;

  return (
    <>
      {post.mine ? (
        confirming ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                remove.mutate({ path });
              }}
            >
              {t('confirmDelete')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setConfirming(false);
              }}
            >
              {t('cancel')}
            </Button>
          </>
        ) : (
          <>
            {onEdit !== undefined && post.state === 'visible' ? (
              <Button type="button" size="sm" variant="ghost" onClick={onEdit}>
                {t('edit')}
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setConfirming(true);
              }}
            >
              {t('delete')}
            </Button>
          </>
        )
      ) : null}
      {canModerate ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={visibility.isPending}
          onClick={() => {
            visibility.mutate({ path, body: { hidden: post.state !== 'hidden' } });
          }}
        >
          {post.state === 'hidden' ? t('restore') : t('hide')}
        </Button>
      ) : null}
    </>
  );
}
