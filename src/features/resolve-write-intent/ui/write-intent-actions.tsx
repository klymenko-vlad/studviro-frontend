'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  isInFlight,
  writeIntentMutations,
  writeIntentQueries,
  type WriteIntent,
} from '@/entities/write-intent';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

export function WriteIntentActions({
  institutionId,
  intent,
}: {
  institutionId: string;
  intent: WriteIntent;
}) {
  const t = useTranslations('sync.writeBack');
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: writeIntentQueries.listKey({ path: { institutionId } }),
    });

  const retry = useMutation({
    ...writeIntentMutations.retry(),
    onSuccess: async () => {
      toast.success(t('retried'));
      await invalidate();
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  const discard = useMutation({
    ...writeIntentMutations.discard(),
    onSuccess: async () => {
      toast.success(t('discarded'));
      await invalidate();
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  const pending = retry.isPending || discard.isPending;
  const path = { institutionId, id: intent.id };

  if (isInFlight(intent))
    return <p className="text-muted-foreground text-xs">{t('inFlightNote')}</p>;

  return (
    <div className="flex gap-2 whitespace-nowrap">
      <Button
        type="button"
        size="sm"
        disabled={pending}
        onClick={() => {
          retry.mutate({ path });
        }}
      >
        {retry.isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
        {t('retry')}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          discard.mutate({ path });
        }}
      >
        {discard.isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
        {t('discard')}
      </Button>
    </div>
  );
}
