'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { notificationMutations } from '@/entities/notification';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

import { invalidateNotifications } from './mark-notification-read-button';

export function MarkAllNotificationsReadButton({
  institutionId,
  unreadCount,
}: {
  institutionId: string;
  unreadCount: number;
}) {
  const t = useTranslations('notifications');
  const queryClient = useQueryClient();

  const markAllRead = useMutation({
    ...notificationMutations.markAllRead(),
    onSuccess: async () => {
      toast.success(t('markAllReadSucceeded'));
      await invalidateNotifications(queryClient, institutionId);
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={markAllRead.isPending || unreadCount === 0}
      onClick={() => {
        markAllRead.mutate({ path: { institutionId } });
      }}
    >
      {markAllRead.isPending ? (
        <LoaderCircle className="animate-spin" aria-hidden />
      ) : null}
      {t('markAllRead')}
    </Button>
  );
}
