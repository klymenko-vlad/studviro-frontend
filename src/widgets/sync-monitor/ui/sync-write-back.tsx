'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';

import { WriteIntentActions } from '@/features/resolve-write-intent';
import {
  writeIntentBadgeVariant,
  writeIntentQueries,
  type WriteIntent,
} from '@/entities/write-intent';
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

export function SyncWriteBack({
  institutionId,
  canRun,
}: {
  institutionId: string;
  canRun: boolean;
}) {
  const t = useTranslations('sync.writeBack');
  const intents = useQuery(writeIntentQueries.list({ path: { institutionId } }));

  if (intents.isPending) return <Skeleton className="h-24 w-full" />;
  if (intents.isError)
    return <p className="text-muted-foreground text-sm">{t('error')}</p>;

  if (intents.data.length === 0)
    return (
      <p className="text-muted-foreground text-sm" data-testid="write-back-empty">
        {t('empty')}
      </p>
    );

  return (
    <Table data-testid="write-back-table">
      <TableHeader>
        <TableRow>
          <TableHead>{t('column.kind')}</TableHead>
          <TableHead>{t('column.state')}</TableHead>
          <TableHead>{t('column.attempts')}</TableHead>
          <TableHead>{t('column.queuedAt')}</TableHead>
          <TableHead>{t('column.reason')}</TableHead>
          {canRun ? <TableHead>{t('column.actions')}</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {intents.data.map(intent => (
          <WriteIntentRow
            key={intent.id}
            institutionId={institutionId}
            intent={intent}
            canRun={canRun}
          />
        ))}
      </TableBody>
    </Table>
  );
}

function WriteIntentRow({
  institutionId,
  intent,
  canRun,
}: {
  institutionId: string;
  intent: WriteIntent;
  canRun: boolean;
}) {
  const t = useTranslations('sync.writeBack');
  const format = useFormatter();

  return (
    <TableRow>
      <TableCell className="font-medium">{t(`kind.${intent.kind}`)}</TableCell>
      <TableCell>
        <Badge variant={writeIntentBadgeVariant(intent.state)}>
          {t(`state.${intent.state}`)}
        </Badge>
      </TableCell>
      <TableCell>{intent.attempts}</TableCell>
      <TableCell className="whitespace-nowrap">
        {format.dateTime(new Date(intent.createdAt), {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}
      </TableCell>
      <TableCell>{intent.lastErrorMessage ?? t('noReason')}</TableCell>
      {canRun ? (
        <TableCell>
          <WriteIntentActions institutionId={institutionId} intent={intent} />
        </TableCell>
      ) : null}
    </TableRow>
  );
}
