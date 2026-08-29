'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import {
  syncRunQueries,
  SyncRunStatusBadge,
  touchedRecords,
  type SyncRun,
} from '@/entities/sync-run';
import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';

export function SyncRunDomains({
  institutionId,
  run,
}: {
  institutionId: string;
  run: SyncRun;
}) {
  const t = useTranslations('sync');
  const { data, isPending, isError } = useQuery(
    syncRunQueries.detail({ path: { institutionId, runId: run.id } }),
  );

  if (isPending)
    return <Skeleton className="h-32 w-full" data-testid="sync-domains-loading" />;

  if (isError || data.domains.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('noDomainResults')}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('column.domain')}</TableHead>
          <TableHead>{t('column.status')}</TableHead>
          <TableHead>{t('column.records')}</TableHead>
          <TableHead>{t('column.duration')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.domains.map(domain => (
          <TableRow key={domain.domain}>
            <TableCell className="font-medium">{t(`domain.${domain.domain}`)}</TableCell>
            <TableCell>
              <SyncRunStatusBadge status={domain.status} />
              {domain.errorMessage === null ? null : (
                <span className="text-destructive block text-xs">
                  {domain.errorMessage}
                </span>
              )}
            </TableCell>
            <TableCell>
              {t('records', {
                fetched: domain.fetched,
                touched: touchedRecords(domain),
              })}
              {domain.failed > 0 ? (
                <span className="text-destructive block text-xs">
                  {t('recordsFailed', { failed: domain.failed })}
                </span>
              ) : null}
            </TableCell>
            <TableCell>
              {t('seconds', { seconds: (domain.durationMs / 1000).toFixed(1) })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
