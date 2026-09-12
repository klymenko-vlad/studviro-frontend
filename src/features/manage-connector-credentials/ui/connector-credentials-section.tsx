'use client';

import { useQuery } from '@tanstack/react-query';

import { institutionConfigurationQueries } from '@/entities/institution-configuration';
import { Skeleton } from '@/shared/ui';

import { ConnectorCredentialsCard } from './connector-credentials-card';

export function ConnectorCredentialsSection({
  institutionId,
}: {
  institutionId: string;
}) {
  const { data: statuses, isPending } = useQuery(
    institutionConfigurationQueries.connectors({ path: { institutionId } }),
  );

  if (isPending) return <Skeleton className="h-24 w-full" />;

  const configuredKinds = (statuses ?? []).filter(status => status.name !== null);

  if (configuredKinds.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      {configuredKinds.map(status => (
        <ConnectorCredentialsCard
          key={status.kind}
          institutionId={institutionId}
          kind={status.kind}
        />
      ))}
    </div>
  );
}
