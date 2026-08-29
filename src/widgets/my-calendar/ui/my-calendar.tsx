'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTimeZone, useTranslations } from 'next-intl';

import {
  addDays,
  addWeeks,
  groupEventsByDay,
  startOfWeek,
  timetableEventQueries,
} from '@/entities/timetable-event';
import { Alert, AlertDescription, AlertTitle, Button, Skeleton } from '@/shared/ui';

import { CalendarDaySection } from './calendar-day-section';

export function MyCalendar({
  institutionId,
  today = new Date(),
}: {
  institutionId: string;
  today?: Date;
}) {
  const t = useTranslations('calendar');
  const format = useFormatter();
  const timeZone = useTimeZone() ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [from, setFrom] = useState(() => startOfWeek(today));
  const to = addWeeks(from, 1);

  const { data, isPending, isError } = useQuery(
    timetableEventQueries.list({
      path: { institutionId },
      query: { from: from.toISOString(), to: to.toISOString() },
    }),
  );

  const day = { day: 'numeric', month: 'short' } as const;
  const lastDay = addDays(from, 6);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="font-medium" data-testid="calendar-week">
            {t('week', {
              from: format.dateTime(from, day),
              to: format.dateTime(lastDay, day),
            })}
          </p>
          {isPending || isError ? null : (
            <p className="text-muted-foreground text-sm">
              {t('weekSummary', { events: data.length })}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFrom(addWeeks(from, -1));
            }}
          >
            {t('previousWeek')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFrom(startOfWeek(today));
            }}
          >
            {t('thisWeek')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFrom(addWeeks(from, 1));
            }}
          >
            {t('nextWeek')}
          </Button>
        </div>
      </div>

      {isPending ? (
        <Skeleton className="h-64 w-full" data-testid="my-calendar-loading" />
      ) : isError ? (
        <Alert variant="destructive">
          <AlertTitle>{t('errorTitle')}</AlertTitle>
          <AlertDescription>{t('errorDescription')}</AlertDescription>
        </Alert>
      ) : data.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('empty')}</p>
      ) : (
        groupEventsByDay(data, timeZone).map(entry => (
          <CalendarDaySection
            key={entry.key}
            day={entry}
            institutionId={institutionId}
            today={today}
            timeZone={timeZone}
          />
        ))
      )}
    </div>
  );
}
