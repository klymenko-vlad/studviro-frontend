'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  discussionMutations,
  discussionQueries,
  type DiscussionAddress,
} from '@/entities/discussion';
import { toApiError } from '@/shared/api';
import { Button, Input, Label } from '@/shared/ui';

import { useRefreshDiscussion } from '../model/use-refresh-discussion';

const MAX_TITLE = 200;

export function ThreadTitle({
  address,
  threadId,
  title,
  canRename,
}: {
  address: DiscussionAddress;
  threadId: string;
  title: string;
  canRename: boolean;
}) {
  const t = useTranslations('discussion');
  const queryClient = useQueryClient();
  const refresh = useRefreshDiscussion();
  const [draft, setDraft] = useState<string | null>(null);

  const rename = useMutation({
    ...discussionMutations.renameThread(),
    onSuccess: async thread => {
      queryClient.setQueryData(
        discussionQueries.threadKey({ path: { ...address, threadId } }),
        thread,
      );
      setDraft(null);
      toast.success(t('renamed'));
      await refresh();
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  if (draft !== null) {
    const trimmed = draft.trim();

    return (
      <form
        className="flex flex-1 flex-wrap items-end gap-2"
        onSubmit={event => {
          event.preventDefault();
          if (trimmed === '') return;
          rename.mutate({ path: { ...address, threadId }, body: { title: trimmed } });
        }}
      >
        <div className="flex min-w-60 flex-1 flex-col gap-1.5">
          <Label htmlFor="discussion-thread-title">{t('titleLabel')}</Label>
          <Input
            id="discussion-thread-title"
            value={draft}
            maxLength={MAX_TITLE}
            onChange={event => {
              setDraft(event.target.value);
            }}
          />
        </div>
        <Button type="submit" size="sm" disabled={rename.isPending || trimmed === ''}>
          {t('save')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setDraft(null);
          }}
        >
          {t('cancel')}
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <h3 className="type-heading text-lg font-semibold">
        {title === '' ? t('untitled') : title}
      </h3>
      {canRename ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setDraft(title);
          }}
        >
          {t('rename')}
        </Button>
      ) : null}
    </div>
  );
}
