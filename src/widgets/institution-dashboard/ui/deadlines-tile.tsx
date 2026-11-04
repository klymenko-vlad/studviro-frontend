'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';

import { deadlineQueries, nextDeadlines } from '@/entities/deadline';
import { plannerQueries } from '@/entities/planner';
import { Link } from '@/shared/config';
import {
  Badge,
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

import { deadlineHorizon } from '../model/deadline-horizon';
import { upcomingDue } from '../model/upcoming-due';
import { useRelativeDue } from '../model/use-relative-due';
import { useTileHeading } from './tile-heading';

const SHOWN = 4;

export function DeadlinesTile({
  institutionId,
  now = new Date(),
}: {
  institutionId: string;
  now?: Date;
}) {
  const t = useTranslations('dashboard');
  const heading = useTileHeading();
  const format = useFormatter();
  const relative = useRelativeDue(now);
  const [range] = useState(() => deadlineHorizon(now));
  const { data, isPending, isError, refetch } = useQuery(
    deadlineQueries.list({ path: { institutionId }, query: range }),
  );
  const tasks = useQuery(
    plannerQueries.dueTasks({ path: { institutionId }, query: range }),
  );
  const own = tasks.data ?? [];

  const due = upcomingDue(
    data === undefined ? [] : nextDeadlines(data, SHOWN),
    own,
    SHOWN,
  );
  const tPlanner = useTranslations('planner');

  return (
    <Card>
      <CardHeader>
        <CardTitle as={heading}>{t('deadlines.title')}</CardTitle>
        <CardDescription>{t('deadlines.description')}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {isPending ? (
          <ListSkeleton items={2} data-testid="dashboard-deadlines-loading" />
        ) : isError ? (
          <QueryError title={t('deadlines.error')} onRetry={refetch} />
        ) : due.length === 0 ? (
          <EmptyState size="inline" title={t('deadlines.empty')} />
        ) : (
          <>
            <p className="text-sm" data-testid="dashboard-deadlines-summary">
              {own.length === 0
                ? t('deadlines.summary', { deadlines: data.length })
                : data.length === 0
                  ? t('deadlines.summaryTasksOnly', { tasks: own.length })
                  : t('deadlines.summaryWithTasks', {
                      deadlines: data.length,
                      tasks: own.length,
                    })}
            </p>

            <ul className="flex flex-col gap-1 text-sm">
              {due.map(item => (
                <li key={item.key} className="flex justify-between gap-4">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate">
                      {item.courseCode === null
                        ? item.title
                        : `${item.title} · ${item.courseCode}`}
                    </span>
                    {item.courseCode === null ? (
                      <Badge variant="outline">{tPlanner('personal')}</Badge>
                    ) : null}
                  </span>
                  <span className="flex flex-col items-end text-xs whitespace-nowrap">
                    <span className="font-medium">{relative(item.dueAt)}</span>
                    <time dateTime={item.dueAt} className="text-muted-foreground">
                      {format.dateTime(new Date(item.dueAt), {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: 'numeric',
                        minute: 'numeric',
                      })}
                    </time>
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
