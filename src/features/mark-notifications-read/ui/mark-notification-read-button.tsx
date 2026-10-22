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

  if (!isUnread(notification)) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={markRead.isPending}
      onClick={() => {
        markRead.mutate({ path: { institutionId, id: notification.id } });
      }}
    >
      {markRead.isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
      {t('markRead')}
    </Button>
  );
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
