'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';

import { deadlineQueries, nextDeadlines } from '@/entities/deadline';
import { addDays } from '@/entities/timetable-event';
import { Link } from '@/shared/config';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/shared/ui';

const SHOWN = 4;
const HORIZON_DAYS = 14;

export function DeadlinesTile({
  institutionId,
  now = new Date(),
}: {
  institutionId: string;
  now?: Date;
}) {
  const t = useTranslations('dashboard');
  const format = useFormatter();
  const [range] = useState(() => ({
    from: now.toISOString(),
    to: addDays(now, HORIZON_DAYS).toISOString(),
  }));
  const { data, isPending, isError } = useQuery(
    deadlineQueries.list({ path: { institutionId }, query: range }),
  );

  const due = data === undefined ? [] : nextDeadlines(data, SHOWN);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('deadlines.title')}</CardTitle>
        <CardDescription>{t('deadlines.description')}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {isPending ? (
          <Skeleton className="h-24 w-full" data-testid="dashboard-deadlines-loading" />
        ) : isError ? (
          <p className="text-destructive text-sm">{t('deadlines.error')}</p>
        ) : due.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('deadlines.empty')}</p>
        ) : (
          <>
            <p className="text-sm" data-testid="dashboard-deadlines-summary">
              {t('deadlines.summary', { deadlines: data.length })}
            </p>

            <ul className="flex flex-col gap-1 text-sm">
              {due.map(deadline => (
                <li key={deadline.id} className="flex justify-between gap-4">
                  <span className="truncate">
                    {deadline.name} · {deadline.course.code}
                  </span>
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                    {format.dateTime(new Date(deadline.dueAt), {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
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
            {t('deadlines.link')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
