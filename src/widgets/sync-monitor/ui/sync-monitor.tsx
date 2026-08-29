'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';

import { StartSyncRunButton } from '@/features/start-sync-run';
import {
  activeRun,
  failingDomains,
  latestRun,
  oldestSuccess,
  syncRunQueries,
} from '@/entities/sync-run';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/shared/ui';

import { SyncFreshness } from './sync-freshness';
import { SyncRunDomains } from './sync-run-domains';
import { SyncRunHistory } from './sync-run-history';

const ACTIVE_POLL_MS = 5000;

export function SyncMonitor({
  institutionId,
  canRun,
}: {
  institutionId: string;
  canRun: boolean;
}) {
  const t = useTranslations('sync');
  const format = useFormatter();

  const runs = useQuery({
    ...syncRunQueries.list({ path: { institutionId } }),
    refetchInterval: query =>
      activeRun(query.state.data ?? []) === null ? false : ACTIVE_POLL_MS,
  });

  const state = useQuery({
    ...syncRunQueries.state({ path: { institutionId } }),
    refetchInterval: runs.data && activeRun(runs.data) ? ACTIVE_POLL_MS : false,
  });

  if (runs.isPending || state.isPending)
    return <Skeleton className="h-64 w-full" data-testid="sync-monitor-loading" />;

  if (runs.isError || state.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('errorTitle')}</AlertTitle>
        <AlertDescription>{t('errorDescription')}</AlertDescription>
      </Alert>
    );
  }

  const active = activeRun(runs.data);
  const latest = latestRun(runs.data);
  const failing = failingDomains(state.data);
  const freshest = oldestSuccess(state.data);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4" aria-labelledby="sync-overview">
        <h2 id="sync-overview" className="text-lg font-semibold">
          {t('overviewTitle')}
        </h2>

        <p className="text-muted-foreground text-sm" data-testid="sync-freshness-summary">
          {freshest === null
            ? t('freshnessUnknown')
            : t('freshness', {
                at: format.dateTime(new Date(freshest), {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }),
              })}
        </p>

        {active === null ? null : (
          <Alert data-testid="sync-active-notice">
            <AlertTitle>{t('activeTitle')}</AlertTitle>
            <AlertDescription>
              {t('activeDescription', { mode: t(`mode.${active.mode}`) })}
            </AlertDescription>
          </Alert>
        )}

        {failing.length === 0 ? null : (
          <Alert variant="destructive">
            <AlertTitle>{t('failingTitle')}</AlertTitle>
            <AlertDescription>
              {t('failingDescription', { count: failing.length })}
            </AlertDescription>
          </Alert>
        )}

        {canRun ? (
          <StartSyncRunButton institutionId={institutionId} disabled={active !== null} />
        ) : (
          <p className="text-muted-foreground text-sm">{t('runDenied')}</p>
        )}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t('freshnessTitle')}</CardTitle>
          <CardDescription>{t('freshnessDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {state.data.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('noState')}</p>
          ) : (
            <SyncFreshness watermarks={state.data} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('latestTitle')}</CardTitle>
          <CardDescription>{t('latestDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {latest === null ? (
            <p className="text-muted-foreground text-sm">{t('noRuns')}</p>
          ) : (
            <SyncRunDomains institutionId={institutionId} run={latest} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('historyTitle')}</CardTitle>
          <CardDescription>{t('historyDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {runs.data.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('noRuns')}</p>
          ) : (
            <SyncRunHistory runs={runs.data} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
