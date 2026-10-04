'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';

import { auditEventQueries, labelKeyFor } from '@/entities/audit-event';
import { institutionRoutes, Link } from '@/shared/config';
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

const SHOWN = 5;

export function RecentActivityTile({
  institutionId,
  now: initialNow,
}: {
  institutionId: string;
  now?: Date;
}) {
  const t = useTranslations('dashboard.activity');
  const tAudit = useTranslations('audit');
  const heading = useTileHeading();
  const format = useFormatter();
  const [now] = useState(() => initialNow ?? new Date());
  const { data, isPending, isError, refetch } = useQuery(
    auditEventQueries.list({
      path: { institutionId },
      query: { limit: SHOWN, order: 'desc' },
    }),
  );

  const events = data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle as={heading}>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {isPending ? (
          <ListSkeleton items={3} data-testid="dashboard-activity-loading" />
        ) : isError ? (
          <QueryError title={t('error')} onRetry={refetch} />
        ) : events.length === 0 ? (
          <EmptyState size="inline" title={t('empty')} />
        ) : (
          <ul className="flex flex-col divide-y text-sm">
            {events.map(event => (
              <li
                key={event.id}
                className="flex items-baseline justify-between gap-4 py-2"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium">
                    {tAudit(`action.${labelKeyFor(event.action)}`)}
                  </span>
                  {event.summary ? (
                    <span className="text-muted-foreground truncate text-xs">
                      {event.summary}
                    </span>
                  ) : null}
                </span>
                <time
                  dateTime={event.occurredAt}
                  className="text-muted-foreground text-xs whitespace-nowrap"
                >
                  {format.relativeTime(new Date(event.occurredAt), now)}
                </time>
              </li>
            ))}
          </ul>
        )}

        <Button asChild variant="outline" size="sm" className="self-start">
          <Link href={institutionRoutes(institutionId).audit}>{t('link')}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
