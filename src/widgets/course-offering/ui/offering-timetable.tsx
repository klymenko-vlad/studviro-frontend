'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTimeZone, useTranslations } from 'next-intl';

import { TimetableEventActions, TimetableEventForm } from '@/features/manage-timetable';
import {
  bySlot,
  isCancelled,
  offeringTimetableQueries,
} from '@/entities/offering-timetable';
import { usePermissions } from '@/entities/permission';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ListSkeleton,
} from '@/shared/ui';

export function OfferingTimetable({
  institutionId,
  offeringId,
}: {
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('timetableAdmin');
  const format = useFormatter();
  // The same resolution the week calendar uses, so the two screens agree about
  // when a class is.
  const timeZone = useTimeZone() ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { can } = usePermissions(institutionId);
  const manageable = can('schedule:manage');

  const events = useQuery(
    offeringTimetableQueries.list({ path: { institutionId, offeringId } }),
  );

  const when = (iso: string) =>
    format.dateTime(new Date(iso), { day: 'numeric', month: 'short', timeZone });
  const clock = (iso: string) =>
    format.dateTime(new Date(iso), {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {manageable ? (
          <TimetableEventForm institutionId={institutionId} offeringId={offeringId} />
        ) : null}

        {events.isPending ? (
          <ListSkeleton items={2} data-testid="offering-timetable-loading" />
        ) : events.isError ? (
          <p className="text-muted-foreground text-sm">{t('error')}</p>
        ) : events.data.length === 0 ? (
          <EmptyState size="inline" title={t('empty')} />
        ) : (
          <ul className="flex flex-col gap-5" aria-label={t('title')}>
            {bySlot(events.data, timeZone).map(slot => {
              const first = slot.events[0];
              if (!first) return null;

              return (
                <li key={slot.key} className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {t('slotWhen', {
                        weekday: t(`weekday.${slot.weekday}`),
                        from: clock(first.startsAt),
                        to: clock(first.endsAt),
                      })}
                    </span>
                    <Badge variant="secondary">{t(`type.${first.type}`)}</Badge>
                    {first.roomCode === null ? (
                      <Badge variant="outline">{t('noRoom')}</Badge>
                    ) : (
                      <Badge variant="outline">{first.roomCode}</Badge>
                    )}
                    {first.studyGroupCode === null ? null : (
                      <Badge variant="outline">{first.studyGroupCode}</Badge>
                    )}
                    <span className="text-muted-foreground text-xs">
                      {t('occurrences', { count: slot.events.length })}
                    </span>
                  </div>

                  <ul className="flex flex-wrap gap-x-4 gap-y-1">
                    {slot.events.map(event => (
                      <li
                        key={event.id}
                        className="flex items-center gap-1 text-sm"
                        data-testid="timetable-occurrence"
                      >
                        <span
                          className={
                            isCancelled(event) ? 'text-muted-foreground line-through' : ''
                          }
                        >
                          {when(event.startsAt)}
                        </span>
                        {manageable ? (
                          <TimetableEventActions
                            institutionId={institutionId}
                            offeringId={offeringId}
                            event={event}
                            label={when(event.startsAt)}
                          />
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
