'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  completionMutations,
  invalidateMyProgress,
  isDone,
  type ItemProgress,
} from '@/entities/completion';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

export function MarkDoneToggle({
  institutionId,
  spaceId,
  item,
  title,
  disabled = false,
}: {
  institutionId: string;
  spaceId: string;
  item: ItemProgress;
  title: string;
  disabled?: boolean;
}) {
  const t = useTranslations('completion');
  const queryClient = useQueryClient();
  const done = isDone(item.state);

  const mark = useMutation({
    ...completionMutations.markDone(),
    onSuccess: () => invalidateMyProgress(queryClient),
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  return (
    <Button
      type="button"
      variant={done ? 'secondary' : 'outline'}
      size="sm"
      aria-pressed={done}
      aria-label={t('markDoneNamed', { title })}
      disabled={disabled || mark.isPending}
      onClick={() => {
        mark.mutate({
          path: { institutionId, spaceId, kind: item.kind, itemId: item.id },
          body: { done: !done },
        });
      }}
    >
      {mark.isPending ? (
        <LoaderCircle aria-hidden className="size-4 animate-spin" />
      ) : done ? (
        <Check aria-hidden className="size-4" />
      ) : null}
      {done ? t('done') : t('markDone')}
    </Button>
  );
}
