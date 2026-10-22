'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import {
  MarkAllNotificationsReadButton,
  MarkNotificationReadButton,
  useMarkNotificationRead,
} from '@/features/mark-notifications-read';
import {
  NotificationCard,
  notificationQueries,
  sortByNewest,
  unreadCount,
} from '@/entities/notification';
import { EmptyState, ListSkeleton, QueryError } from '@/shared/ui';

import { notificationHref } from '../model/notification-href';

export function MyNotifications({ institutionId }: { institutionId: string }) {
  const t = useTranslations('notifications');
  const { data, isPending, isError, refetch } = useQuery(
    notificationQueries.list({ path: { institutionId } }),
  );
  const markRead = useMarkNotificationRead(institutionId);

  if (isPending) return <ListSkeleton items={4} data-testid="my-notifications-loading" />;

  if (isError)
    return (
      <QueryError
        onRetry={refetch}
        title={t('errorTitle')}
        description={t('errorDescription')}
      />
    );

  if (data.length === 0) return <EmptyState size="inline" title={t('empty')} />;

  const unread = unreadCount(data);

  return (
    <div className="flex flex-col gap-4" data-testid="my-notifications">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">{t('summary', { count: unread })}</p>
        <MarkAllNotificationsReadButton
          institutionId={institutionId}
          unreadCount={unread}
        />
      </div>

      <ul className="flex flex-col gap-3">
        {sortByNewest(data).map(notification => (
          <li key={notification.id}>
            <NotificationCard
              notification={notification}
              href={notificationHref(institutionId, notification)}
              onOpen={() => {
                markRead.mutate(notification);
              }}
              action={
                <MarkNotificationReadButton
                  institutionId={institutionId}
                  notification={notification}
                />
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
