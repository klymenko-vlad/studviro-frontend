'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  isCancelled,
  offeringTimetableMutations,
  offeringTimetableQueries,
  type OfferingTimetableEvent,
} from '@/entities/offering-timetable';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

/**
 * Cancelling and restoring are one control, because they are one decision
 * seen from either side.
 */
export function TimetableEventActions({
  institutionId,
  offeringId,
  event,
  label,
}: {
  institutionId: string;
  offeringId: string;
  event: OfferingTimetableEvent;
  label: string;
}) {
  const t = useTranslations('timetableAdmin');
  const queryClient = useQueryClient();
  const cancelled = isCancelled(event);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: offeringTimetableQueries.listKey({ path: { institutionId, offeringId } }),
    });

  const settled = (message: string) => ({
    onSuccess: async () => {
      toast.success(message);
      await invalidate();
    },
    onError: (error: unknown) => {
      toast.error(toApiError(error).message);
    },
  });

  const cancel = useMutation({
    ...offeringTimetableMutations.cancel(),
    ...settled(t('cancelled', { label })),
  });
  const restore = useMutation({
    ...offeringTimetableMutations.restore(),
    ...settled(t('restored', { label })),
  });

  const pending = cancel.isPending || restore.isPending;
  const path = { institutionId, offeringId, eventId: event.id };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label={cancelled ? t('restoreNamed', { label }) : t('cancelNamed', { label })}
      onClick={() => {
        if (cancelled) restore.mutate({ path });
        else cancel.mutate({ path });
      }}
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {cancelled ? t('restore') : t('cancel')}
    </Button>
  );
}
