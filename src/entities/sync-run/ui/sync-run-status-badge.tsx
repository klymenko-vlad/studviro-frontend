import { useTranslations } from 'next-intl';

import { Badge } from '@/shared/ui';

import type { SyncDomainResult, SyncRunStatus } from '../model/sync-run';

type Status = SyncRunStatus | SyncDomainResult['status'];

const VARIANT: Record<Status, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  queued: 'outline',
  running: 'secondary',
  succeeded: 'default',
  partial: 'secondary',
  failed: 'destructive',
  skipped: 'outline',
};

export function SyncRunStatusBadge({ status }: { status: Status }) {
  const t = useTranslations('sync');

  return <Badge variant={VARIANT[status]}>{t(`status.${status}`)}</Badge>;
}
