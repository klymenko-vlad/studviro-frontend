import { useTranslations } from 'next-intl';

import type { ConnectorStatus } from '@/entities/institution-configuration';
import { Badge } from '@/shared/ui';

export function ConnectorStatusItem({ status }: { status: ConnectorStatus }) {
  const t = useTranslations('institutionSettings');

  const state = status.name === null ? 'none' : status.healthy ? 'healthy' : 'unhealthy';

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div className="flex flex-col gap-1">
        <span className="font-medium">{t(`connector.${status.kind}`)}</span>
        <span className="text-muted-foreground text-sm">
          {status.name ?? t('connectorNone')}
          {status.capabilities.length > 0
            ? t('capabilityCount', { count: status.capabilities.length })
            : ''}
        </span>
        {status.detail ? (
          <span className="text-muted-foreground text-sm">{status.detail}</span>
        ) : null}
      </div>

      <Badge variant={state === 'healthy' ? 'default' : 'outline'}>
        {t(`connectorState.${state}`)}
      </Badge>
    </li>
  );
}
