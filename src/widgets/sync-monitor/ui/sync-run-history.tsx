import { useFormatter, useTranslations } from 'next-intl';

import {
  runDurationMs,
  SyncRunStatusBadge,
  touchedRecords,
  type SyncRun,
} from '@/entities/sync-run';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';

export function SyncRunHistory({ runs }: { runs: SyncRun[] }) {
  const t = useTranslations('sync');
  const format = useFormatter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('column.queued')}</TableHead>
          <TableHead>{t('column.mode')}</TableHead>
          <TableHead>{t('column.status')}</TableHead>
          <TableHead>{t('column.records')}</TableHead>
          <TableHead>{t('column.duration')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {runs.map(run => {
          const duration = runDurationMs(run);

          return (
            <TableRow key={run.id}>
              <TableCell>
                {format.dateTime(new Date(run.queuedAt), {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
                <span className="text-muted-foreground block text-xs">
                  {t(`trigger.${run.trigger}`)} · {run.connectorName}
                </span>
              </TableCell>
              <TableCell>{t(`mode.${run.mode}`)}</TableCell>
              <TableCell>
                <SyncRunStatusBadge status={run.status} />
                {run.errorMessage === null ? null : (
                  <span className="text-destructive block text-xs">
                    {run.errorMessage}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {t('records', {
                  fetched: run.fetched,
                  touched: touchedRecords(run),
                })}
                {run.failed > 0 ? (
                  <span className="text-destructive block text-xs">
                    {t('recordsFailed', { failed: run.failed })}
                  </span>
                ) : null}
              </TableCell>
              <TableCell>
                {duration === null
                  ? t('none')
                  : t('seconds', { seconds: (duration / 1000).toFixed(1) })}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
