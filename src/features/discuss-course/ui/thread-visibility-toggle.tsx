'use client';

import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { discussionMutations, type DiscussionAddress } from '@/entities/discussion';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

import { useRefreshDiscussion } from '../model/use-refresh-discussion';

export function ThreadVisibilityToggle({
  address,
  threadId,
  hidden,
}: {
  address: DiscussionAddress;
  threadId: string;
  hidden: boolean;
}) {
  const t = useTranslations('discussion');
  const refresh = useRefreshDiscussion();

  const mutation = useMutation({
    ...discussionMutations.setThreadVisibility(),
    onSuccess: async (_, { body }) => {
      toast.success(body.hidden ? t('hiddenDone') : t('restoredDone'));
      await refresh();
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={mutation.isPending}
      onClick={() => {
        mutation.mutate({ path: { ...address, threadId }, body: { hidden: !hidden } });
      }}
    >
      {hidden ? t('restoreThread') : t('hideThread')}
    </Button>
  );
}
