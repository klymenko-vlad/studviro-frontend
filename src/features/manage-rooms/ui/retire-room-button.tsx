'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { roomMutations, roomQueries } from '@/entities/room';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

export function RetireRoomButton({
  institutionId,
  roomId,
  roomCode,
}: {
  institutionId: string;
  roomId: string;
  roomCode: string;
}) {
  const t = useTranslations('rooms');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...roomMutations.remove(),
    onSuccess: async () => {
      toast.success(t('retired', { code: roomCode }));
      await queryClient.invalidateQueries({
        queryKey: roomQueries.listKey({ path: { institutionId } }),
      });
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={mutation.isPending}
      aria-label={t('retireNamed', { code: roomCode })}
      onClick={() => {
        mutation.mutate({ path: { institutionId, id: roomId } });
      }}
    >
      {mutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {t('retire')}
    </Button>
  );
}
