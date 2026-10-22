'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';

import {
  addWeeks,
  eventTitle,
  startOfWeek,
  timetableEventQueries,
} from '@/entities/timetable-event';
import { Link } from '@/shared/config';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ListSkeleton,
  QueryError,
} from '@/shared/ui';

import { useTileHeading } from './tile-heading';

const SHOWN = 4;

export function CalendarTile({
  institutionId,
  now = new Date(),
}: {
  institutionId: string;
  now?: Date;
}) {
  const t = useTranslations('dashboard');
  const heading = useTileHeading();
  const format = useFormatter();
  // Pinned once: a range recomputed per render is a new query key per render.
  const [range] = useState(() => ({
    from: now.toISOString(),
    to: addWeeks(startOfWeek(now), 1).toISOString(),
  }));
  const { data, isPending, isError, refetch } = useQuery(
    timetableEventQueries.list({ path: { institutionId }, query: range }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle as={heading}>{t('calendar.title')}</CardTitle>
        <CardDescription>{t('calendar.description')}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {isPending ? (
          <ListSkeleton items={2} data-testid="dashboard-calendar-loading" />
        ) : isError ? (
          <QueryError title={t('calendar.error')} onRetry={refetch} />
        ) : data.length === 0 ? (
          <EmptyState size="inline" title={t('calendar.empty')} />
        ) : (
          <>
            <p className="text-sm" data-testid="dashboard-calendar-summary">
              {t('calendar.summary', { events: data.length })}
            </p>

            <ul className="flex flex-col gap-1 text-sm">
              {data.slice(0, SHOWN).map(event => (
                <li key={event.id} className="flex justify-between gap-4">
                  <span className="truncate">
                    {event.isCancelled
                      ? `${eventTitle(event)} · ${t('calendar.cancelled')}`
                      : eventTitle(event)}
                  </span>
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                    {format.dateTime(new Date(event.startsAt), {
                      weekday: 'short',
                      hour: 'numeric',
                      minute: 'numeric',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        <Button asChild variant="outline" size="sm" className="self-start">
          <Link href={`/institutions/${institutionId}/calendar`}>
            {t('calendar.link')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
