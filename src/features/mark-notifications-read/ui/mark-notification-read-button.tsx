'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  isUnread,
  notificationMutations,
  notificationQueries,
  type Notification,
} from '@/entities/notification';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

export function MarkNotificationReadButton({
  institutionId,
  notification,
}: {
  institutionId: string;
  notification: Notification;
}) {
  const t = useTranslations('notifications');
  const markRead = useMarkNotificationRead(institutionId);

  if (!isUnread(notification)) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={markRead.isPending}
      onClick={() => {
        markRead.mutate(notification);
      }}
    >
      {markRead.isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
      {t('markRead')}
    </Button>
  );
}

/**
 * Following a notification is reading it, so the card's link marks it read on
 * the way out; an already-read one costs no request.
 */
export function useMarkNotificationRead(institutionId: string) {
  const queryClient = useQueryClient();

  const markRead = useMutation({
    ...notificationMutations.markRead(),
    onSuccess: async () => {
      await invalidateNotifications(queryClient, institutionId);
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  return {
    isPending: markRead.isPending,
    mutate: (notification: Notification) => {
      if (!isUnread(notification)) return;
      markRead.mutate({ path: { institutionId, id: notification.id } });
    },
  };
}

export async function invalidateNotifications(
  queryClient: ReturnType<typeof useQueryClient>,
  institutionId: string,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: notificationQueries.listKey({ path: { institutionId } }),
    }),
    queryClient.invalidateQueries({
      queryKey: notificationQueries.unreadCountKey({ path: { institutionId } }),
    }),
  ]);
}
