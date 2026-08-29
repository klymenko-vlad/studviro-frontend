import { useFormatter, useTranslations } from 'next-intl';

import { SyncRunStatusBadge, type SyncWatermark } from '@/entities/sync-run';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';

export function SyncFreshness({ watermarks }: { watermarks: SyncWatermark[] }) {
  const t = useTranslations('sync');
  const format = useFormatter();

  const moment = (value: string | null) =>
    value === null
      ? t('never')
      : format.dateTime(new Date(value), { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('column.domain')}</TableHead>
          <TableHead>{t('column.status')}</TableHead>
          <TableHead>{t('column.lastSucceeded')}</TableHead>
          <TableHead>{t('column.sourceUpdated')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {watermarks.map(watermark => (
          <TableRow key={watermark.domain}>
            <TableCell className="font-medium">
              {t(`domain.${watermark.domain}`)}
            </TableCell>
            <TableCell>
              <SyncRunStatusBadge status={watermark.lastStatus} />
            </TableCell>
            <TableCell>{moment(watermark.lastSucceededAt)}</TableCell>
            <TableCell>
              {moment(watermark.sourceUpdatedAt)}
              {watermark.lastErrorMessage === null ? null : (
                <span className="text-destructive block text-xs">
                  {watermark.lastErrorMessage}
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
