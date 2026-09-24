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
  type Notification,
} from '@/entities/notification';
import { institutionRoutes } from '@/shared/config';
import { EmptyState, ListSkeleton, QueryError } from '@/shared/ui';

export function MyNotifications({ institutionId }: { institutionId: string }) {
  const t = useTranslations('notifications');
  const { data, isPending, isError, refetch } = useQuery(
    notificationQueries.list({ path: { institutionId } }),
  );

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
              href={hrefOf(institutionId, notification)}
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

/**
 * A queueing student holds no place, so the course page would refuse them; the
 * place that came free is taken from the enrolment screen.
 */
function hrefOf(institutionId: string, notification: Notification): string | undefined {
  const routes = institutionRoutes(institutionId);
  if (notification.type === 'waitlist_place_free') return routes.enroll;
  if (notification.courseOfferingId === null) return undefined;

  return routes.courseOffering(notification.courseOfferingId);
}
