'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';

import { reconciliationQueries } from '@/entities/reconciliation';
import {
  Badge,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';

export function ReconciliationResolutions({ institutionId }: { institutionId: string }) {
  const t = useTranslations('sync.reconciliation.resolve');
  const tReconciliation = useTranslations('sync.reconciliation');
  const tSync = useTranslations('sync');
  const format = useFormatter();

  const resolutions = useQuery(
    reconciliationQueries.resolutions({ path: { institutionId } }),
  );

  if (resolutions.isPending) return <Skeleton className="h-24 w-full" />;

  if (resolutions.isError)
    return <p className="text-muted-foreground text-sm">{t('logError')}</p>;

  if (resolutions.data.length === 0)
    return <p className="text-muted-foreground text-sm">{t('logEmpty')}</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{tReconciliation('column.domain')}</TableHead>
          <TableHead>{tReconciliation('column.kind')}</TableHead>
          <TableHead>{t('column.action')}</TableHead>
          <TableHead>{tReconciliation('column.externalId')}</TableHead>
          <TableHead>{t('column.resolvedAt')}</TableHead>
          <TableHead>{tReconciliation('column.detail')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {resolutions.data.map(resolution => (
          <TableRow key={resolution.id}>
            <TableCell className="font-medium">
              {tSync(`domain.${resolution.domain}`)}
            </TableCell>
            <TableCell>{tReconciliation(`kind.${resolution.kind}`)}</TableCell>
            <TableCell>
              <Badge
                variant={resolution.action === 'accept_source' ? 'default' : 'secondary'}
              >
                {t(`action.${resolution.action}`)}
              </Badge>
            </TableCell>
            <TableCell className="font-mono text-xs">{resolution.externalId}</TableCell>
            <TableCell className="whitespace-nowrap">
              {format.dateTime(new Date(resolution.resolvedAt), {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </TableCell>
            <TableCell>{resolution.detail}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
