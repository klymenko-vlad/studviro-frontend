'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import {
  MarkAllNotificationsReadButton,
  MarkNotificationReadButton,
} from '@/features/mark-notifications-read';
import {
  NotificationCard,
  notificationQueries,
  sortByNewest,
  unreadCount,
} from '@/entities/notification';
import { institutionRoutes } from '@/shared/config';
import { Alert, AlertDescription, AlertTitle, Skeleton } from '@/shared/ui';

export function MyNotifications({ institutionId }: { institutionId: string }) {
  const t = useTranslations('notifications');
  const { data, isPending, isError } = useQuery(
    notificationQueries.list({ path: { institutionId } }),
  );

  if (isPending)
    return <Skeleton className="h-64 w-full" data-testid="my-notifications-loading" />;

  if (isError)
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('errorTitle')}</AlertTitle>
        <AlertDescription>{t('errorDescription')}</AlertDescription>
      </Alert>
    );

  if (data.length === 0)
    return <p className="text-muted-foreground text-sm">{t('empty')}</p>;

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
              href={
                notification.courseOfferingId === null
                  ? undefined
                  : `${institutionRoutes(institutionId).courses}/${notification.courseOfferingId}`
              }
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
