'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';

import { ResolveDiscrepancyButtons } from '@/features/resolve-discrepancy';
import {
  disagreeingDomains,
  isClean,
  isResolvable,
  reconciliationQueries,
  type Discrepancy,
  type DiscrepancyKind,
  type DomainReconciliation,
} from '@/entities/reconciliation';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';

import { ReconciliationResolutions } from './reconciliation-resolutions';

const KIND_VARIANT: Record<DiscrepancyKind, 'default' | 'secondary' | 'destructive'> = {
  missing_in_platform: 'destructive',
  missing_in_source: 'secondary',
  stale: 'secondary',
  conflict: 'destructive',
};

export function SyncReconciliation({ institutionId }: { institutionId: string }) {
  const t = useTranslations('sync.reconciliation');
  const tSync = useTranslations('sync');
  const tResolve = useTranslations('sync.reconciliation.resolve');
  const format = useFormatter();

  const report = useQuery({
    ...reconciliationQueries.report({ path: { institutionId } }),
    enabled: false,
  });

  const moment = (value: string | null) =>
    value === null
      ? '—'
      : format.dateTime(new Date(value), { dateStyle: 'medium', timeStyle: 'short' });

  // A discrepancy the source cannot identify has no external id, and several of
  // them can share a kind, so position is the only thing that tells them apart.
  const discrepancyRow = (
    domain: DomainReconciliation,
    discrepancy: Discrepancy,
    at: number,
  ) => (
    <TableRow
      key={`${domain.domain}:${discrepancy.kind}:${discrepancy.externalId}:${at}`}
    >
      <TableCell>
        <Badge variant={KIND_VARIANT[discrepancy.kind]}>
          {t(`kind.${discrepancy.kind}`)}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-xs">{discrepancy.externalId}</TableCell>
      <TableCell>{discrepancy.detail}</TableCell>
      <TableCell>{moment(discrepancy.sourceUpdatedAt)}</TableCell>
      <TableCell>{moment(discrepancy.platformUpdatedAt)}</TableCell>
      <TableCell>
        {isResolvable(discrepancy) ? (
          <ResolveDiscrepancyButtons
            institutionId={institutionId}
            domain={domain.domain}
            discrepancy={discrepancy}
            onResolved={() => void report.refetch()}
          />
        ) : (
          <span className="text-muted-foreground text-xs">
            {tResolve('unresolvable')}
          </span>
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">{t('description')}</p>

      <div>
        <Button onClick={() => void report.refetch()} disabled={report.isFetching}>
          {report.isFetching ? t('checking') : t('checkNow')}
        </Button>
      </div>

      {report.isFetching ? <Skeleton className="h-24 w-full" /> : null}

      {report.isError && !report.isFetching ? (
        <Alert variant="destructive">
          <AlertTitle>{t('errorTitle')}</AlertTitle>
          <AlertDescription>{t('errorDescription')}</AlertDescription>
        </Alert>
      ) : null}

      {report.data && !report.isFetching ? (
        <div className="flex flex-col gap-6">
          <p className="text-muted-foreground text-sm">
            {t('checkedAt', { at: moment(report.data.checkedAt) })}
          </p>

          {isClean(report.data) ? (
            <Alert>
              <AlertTitle>{t('cleanTitle')}</AlertTitle>
              <AlertDescription>{t('cleanDescription')}</AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTitle>{t('dirtyTitle')}</AlertTitle>
              <AlertDescription>
                {t('dirtyDescription', { count: report.data.discrepancyCount })}
              </AlertDescription>
            </Alert>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('column.domain')}</TableHead>
                <TableHead>{t('column.source')}</TableHead>
                <TableHead>{t('column.platform')}</TableHead>
                <TableHead>{t('column.matched')}</TableHead>
                <TableHead>{t('column.discrepancies')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.data.domains.map(domain => (
                <TableRow key={domain.domain}>
                  <TableCell className="font-medium">
                    {tSync(`domain.${domain.domain}`)}
                  </TableCell>
                  <TableCell>
                    {domain.status === 'checked'
                      ? domain.sourceCount
                      : t(`status.${domain.status}`)}
                  </TableCell>
                  <TableCell>{domain.platformCount}</TableCell>
                  <TableCell>{domain.matched}</TableCell>
                  <TableCell>
                    {domain.discrepancyCount}
                    {domain.errorMessage === null ? null : (
                      <span className="text-destructive block text-xs">
                        {domain.errorMessage}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {disagreeingDomains(report.data).map(domain => (
            <section key={domain.domain} className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">
                {t('domainHeading', {
                  domain: tSync(`domain.${domain.domain}`),
                  count: domain.discrepancyCount,
                })}
              </h3>

              {domain.discrepancies.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t('noDetail')}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('column.kind')}</TableHead>
                      <TableHead>{t('column.externalId')}</TableHead>
                      <TableHead>{t('column.detail')}</TableHead>
                      <TableHead>{t('column.sourceUpdated')}</TableHead>
                      <TableHead>{t('column.platformUpdated')}</TableHead>
                      <TableHead>{t('column.resolution')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domain.discrepancies.map((discrepancy, at) =>
                      discrepancyRow(domain, discrepancy, at),
                    )}
                  </TableBody>
                </Table>
              )}

              {domain.truncated ? (
                <p className="text-muted-foreground text-xs">
                  {t('truncated', {
                    shown: domain.discrepancies.length,
                    total: domain.discrepancyCount,
                  })}
                </p>
              ) : null}
            </section>
          ))}
        </div>
      ) : null}

      <section className="flex flex-col gap-2" aria-labelledby="reconciliation-log">
        <h3 id="reconciliation-log" className="text-sm font-semibold">
          {tResolve('logTitle')}
        </h3>
        <p className="text-muted-foreground text-sm">{tResolve('logDescription')}</p>
        <ReconciliationResolutions institutionId={institutionId} />
      </section>
    </div>
  );
}
