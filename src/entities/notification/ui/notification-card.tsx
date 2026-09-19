import type { ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';

import { Link } from '@/shared/config';
import { Badge, Card, CardContent } from '@/shared/ui';

import { isUnread, type Notification } from '../model/notification';

export function NotificationCard({
  notification,
  href,
  action,
}: {
  notification: Notification;
  href?: string;
  action?: ReactNode;
}) {
  const t = useTranslations('notifications');
  const format = useFormatter();

  const startsAt =
    notification.startsAt === null
      ? null
      : format.dateTime(new Date(notification.startsAt), {
          weekday: 'short',
          day: 'numeric',
          month: 'long',
          hour: 'numeric',
          minute: 'numeric',
        });

  const previousStartsAt =
    notification.previousStartsAt === null
      ? null
      : format.dateTime(new Date(notification.previousStartsAt), {
          day: 'numeric',
          month: 'long',
          hour: 'numeric',
          minute: 'numeric',
        });

  const dueAt =
    notification.dueAt === null
      ? null
      : format.dateTime(new Date(notification.dueAt), {
          weekday: 'short',
          day: 'numeric',
          month: 'long',
          hour: 'numeric',
          minute: 'numeric',
        });

  const previousDueAt =
    notification.previousDueAt === null
      ? null
      : format.dateTime(new Date(notification.previousDueAt), {
          day: 'numeric',
          month: 'long',
          hour: 'numeric',
          minute: 'numeric',
        });

  return (
    <Card className={isUnread(notification) ? 'border-primary/40' : 'opacity-80'}>
      <CardContent className="flex flex-col gap-2 py-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base leading-tight font-semibold">
              {t(`type.${notification.type}`)}
            </h2>
            {isUnread(notification) ? <Badge>{t('unread')}</Badge> : null}
            {notification.occurrenceCount > 1 ? (
              <Badge variant="secondary">
                {t('occurrences', { count: notification.occurrenceCount })}
              </Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground text-xs">
            {format.dateTime(new Date(notification.occurredAt), {
              day: 'numeric',
              month: 'long',
              hour: 'numeric',
              minute: 'numeric',
            })}
          </p>
        </div>

        <p className="text-sm">
          {href === undefined || notification.courseTitle === null ? (
            (notification.courseTitle ?? t('unknownCourse'))
          ) : (
            <Link href={href} className="hover:underline focus-visible:underline">
              {notification.courseTitle}
            </Link>
          )}
        </p>

        {notification.courseCode === null ? null : (
          <p className="text-muted-foreground font-mono text-xs">
            {notification.courseCode}
          </p>
        )}

        {notification.activityName === null ? null : (
          <p className="text-sm font-medium">{notification.activityName}</p>
        )}

        {dueAt === null ? null : (
          <p className="text-muted-foreground text-sm">
            {previousDueAt === null
              ? t('dueAt', { date: dueAt })
              : t('dueMovedTo', { from: previousDueAt, to: dueAt })}
          </p>
        )}

        {notification.eventTitle === null ? null : (
          <p className="text-sm font-medium">{notification.eventTitle}</p>
        )}

        {startsAt === null ? null : (
          <p className="text-muted-foreground text-sm">
            {previousStartsAt === null
              ? t('startsAt', { date: startsAt })
              : t('movedTo', { from: previousStartsAt, to: startsAt })}
          </p>
        )}

        {notification.grade === null ? null : (
          <p className="text-sm" data-testid="notification-grade">
            {notification.previousGrade === null
              ? t('gradeIs', { grade: notification.grade })
              : t('gradeChanged', {
                  from: notification.previousGrade,
                  to: notification.grade,
                })}
            {notification.attempt === null || notification.attempt === 1
              ? ''
              : ` · ${t('attempt', { attempt: notification.attempt })}`}
          </p>
        )}

        {notification.reason === null ? null : (
          <p className="text-destructive text-sm" data-testid="notification-reason">
            {t('reason', { reason: notification.reason })}
          </p>
        )}

        {action === undefined ? null : <div className="pt-1">{action}</div>}
      </CardContent>
    </Card>
  );
}
