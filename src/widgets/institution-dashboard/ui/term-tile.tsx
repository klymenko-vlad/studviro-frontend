'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';

import { academicTermQueries, enrollmentWindowState } from '@/entities/academic-term';
import { institutionRoutes, Link } from '@/shared/config';
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
  Progress,
  QueryError,
} from '@/shared/ui';

import {
  currentOrNextTerm,
  termAfter,
  termProgress,
  termWeek,
} from '../model/current-term';
import { useTileHeading } from './tile-heading';

const WINDOW_BADGE = {
  open: 'success',
  upcoming: 'secondary',
  closed: 'outline',
  none: 'outline',
} as const;

export function TermTile({
  institutionId,
  canManageTerms,
  now: initialNow,
}: {
  institutionId: string;
  canManageTerms: boolean;
  now?: Date;
}) {
  const t = useTranslations('dashboard.term');
  const heading = useTileHeading();
  const format = useFormatter();
  const [now] = useState(() => initialNow ?? new Date());
  const { data, isPending, isError, refetch } = useQuery(
    academicTermQueries.list({ path: { institutionId } }),
  );

  const term = data === undefined ? null : currentOrNextTerm(data, now);
  const next = data === undefined || term === null ? null : termAfter(data, term);
  const running = term !== null && new Date(term.startsAt) <= now;
  const date = (iso: string) => format.dateTime(new Date(iso), { dateStyle: 'medium' });

  return (
    <Card>
      <CardHeader>
        <CardTitle as={heading}>{t('title')}</CardTitle>
        <CardDescription>
          {term === null ? t('description') : running ? t('running') : t('upcoming')}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {isPending ? (
          <ListSkeleton items={2} data-testid="dashboard-term-loading" />
        ) : isError ? (
          <QueryError title={t('error')} onRetry={refetch} />
        ) : term === null ? (
          <EmptyState size="inline" title={t('empty')} />
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <p className="font-medium">{term.name}</p>
              <p className="text-muted-foreground text-sm">
                {t('dates', { starts: date(term.startsAt), ends: date(term.endsAt) })}
              </p>
            </div>

            {running ? (
              <div className="flex flex-col gap-2">
                <Progress
                  value={termProgress(term, now)}
                  aria-label={t('progressLabel')}
                />
                <p
                  className="text-muted-foreground text-xs"
                  data-testid="dashboard-term-week"
                >
                  {t('week', termWeek(term, now))}
                </p>
              </div>
            ) : null}

            <EnrollmentWindow term={term} now={now} />

            {next === null ? null : (
              <p className="text-muted-foreground text-sm">
                {t('next', { term: next.name, starts: date(next.startsAt) })}
              </p>
            )}
          </>
        )}

        {canManageTerms ? (
          <Button asChild variant="outline" size="sm" className="self-start">
            <Link href={institutionRoutes(institutionId).terms}>{t('link')}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function EnrollmentWindow({
  term,
  now,
}: {
  term: Parameters<typeof enrollmentWindowState>[0];
  now: Date;
}) {
  const t = useTranslations('dashboard.term');
  const format = useFormatter();
  const state = enrollmentWindowState(term, now);
  const date = (iso: string | null) =>
    iso === null ? '' : format.dateTime(new Date(iso), { dateStyle: 'medium' });

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">{t('enrollment')}</span>
      <Badge variant={WINDOW_BADGE[state]}>{t(`window.${state}`)}</Badge>
      {state === 'open' && term.enrollmentClosesAt !== null ? (
        <span className="text-muted-foreground">
          {t('closes', { date: date(term.enrollmentClosesAt) })}
        </span>
      ) : null}
      {state === 'upcoming' && term.enrollmentOpensAt !== null ? (
        <span className="text-muted-foreground">
          {t('opens', { date: date(term.enrollmentOpensAt) })}
        </span>
      ) : null}
    </div>
  );
}
