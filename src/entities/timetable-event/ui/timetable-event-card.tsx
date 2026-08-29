import { useFormatter, useTranslations } from 'next-intl';

import { Link } from '@/shared/config';
import { Badge, Card, CardContent } from '@/shared/ui';

import {
  eventDurationMinutes,
  eventTitle,
  type TimetableEvent,
} from '../model/timetable-event';

export function TimetableEventCard({
  event,
  href,
}: {
  event: TimetableEvent;
  href?: string;
}) {
  const t = useTranslations('calendar');
  const format = useFormatter();
  const time = { timeStyle: 'short' } as const;

  return (
    <Card className={event.isCancelled ? 'opacity-70' : undefined}>
      <CardContent className="flex flex-col gap-2 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="font-medium">
            {t('time', {
              from: format.dateTime(new Date(event.startsAt), time),
              to: format.dateTime(new Date(event.endsAt), time),
            })}
          </p>
          <p className="text-muted-foreground text-xs">
            {t('duration', { minutes: eventDurationMinutes(event) })}
          </p>
        </div>

        <h3 className="text-base leading-tight font-semibold">
          {href === undefined ? (
            eventTitle(event)
          ) : (
            <Link href={href} className="hover:underline focus-visible:underline">
              {eventTitle(event)}
            </Link>
          )}
        </h3>

        <p className="text-muted-foreground font-mono text-xs">{event.course.code}</p>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{t(`type.${event.type}`)}</Badge>

          {event.attendance === 'teaching' ? (
            <Badge variant="outline">{t('attendance.teaching')}</Badge>
          ) : null}

          {event.studyGroup === null ? null : (
            <Badge variant="outline">
              {t('group', { group: event.studyGroup.code })}
            </Badge>
          )}

          {event.isCancelled ? (
            <Badge variant="destructive">{t('cancelled')}</Badge>
          ) : null}
        </div>

        <p className="text-muted-foreground text-sm">
          {event.room === null
            ? t('noRoom')
            : event.room.building === null
              ? t('room', { room: event.room.code })
              : t('roomIn', { room: event.room.code, building: event.room.building })}
        </p>
      </CardContent>
    </Card>
  );
}
