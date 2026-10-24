'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { quizMutations, quizQueries, type Quiz } from '@/entities/quiz';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

export function QuizActions({
  institutionId,
  spaceId,
  quiz,
  onRemoved,
}: {
  institutionId: string;
  spaceId: string;
  quiz: Quiz;
  onRemoved: () => void;
}) {
  const t = useTranslations('quiz.actions');
  const queryClient = useQueryClient();
  const path = { institutionId, spaceId, quizId: quiz.id };
  const onError = (error: unknown) => {
    toast.error(toApiError(error).message);
  };
  const settle = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: quizQueries.listKey({ path: { institutionId, spaceId } }),
      }),
      queryClient.invalidateQueries({ queryKey: quizQueries.detailKey({ path }) }),
    ]);
  };

  const update = useMutation({ ...quizMutations.update(), onSuccess: settle, onError });
  const remove = useMutation({
    ...quizMutations.remove(),
    onSuccess: async () => {
      toast.success(t('removed', { name: quiz.name }));
      await queryClient.invalidateQueries({
        queryKey: quizQueries.listKey({ path: { institutionId, spaceId } }),
      });
      onRemoved();
    },
    onError,
  });
  const busy = update.isPending || remove.isPending;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => {
          update.mutate({ path, body: { visible: !quiz.visible } });
        }}
      >
        {quiz.visible ? t('hide') : t('show')}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => {
          remove.mutate({ path });
        }}
      >
        {remove.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {t('remove')}
      </Button>
    </div>
  );
}
