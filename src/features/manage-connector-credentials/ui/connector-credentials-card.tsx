'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { connectorCredentialsQueries } from '@/entities/connector-credential';
import type { ConnectorKind } from '@/entities/institution-configuration';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/shared/ui';

import { ConnectorCredentialField } from './connector-credential-field';

interface ConnectorCredentialsCardProps {
  institutionId: string;
  kind: ConnectorKind;
}

export function ConnectorCredentialsCard({
  institutionId,
  kind,
}: ConnectorCredentialsCardProps) {
  const t = useTranslations('institutionSettings');

  const { data, isPending, isError } = useQuery(
    connectorCredentialsQueries.detail({ path: { institutionId, kind } }),
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{t(`connector.${kind}`)}</CardTitle>
          {data ? (
            <Badge variant={data.complete ? 'default' : 'outline'}>
              {data.complete ? t('credentialsComplete') : t('credentialsIncomplete')}
            </Badge>
          ) : null}
        </div>
        <CardDescription>
          {data ? data.connectorName : t('credentialsDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? <Skeleton className="h-24 w-full" /> : null}

        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>{t('credentialsErrorTitle')}</AlertTitle>
            <AlertDescription>{t('credentialsErrorDescription')}</AlertDescription>
          </Alert>
        ) : null}

        {data && data.fields.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('credentialsNoneNeeded')}</p>
        ) : null}

        {data && data.fields.length > 0 ? (
          <div className="flex flex-col gap-4">
            {data.fields.map(field => (
              <ConnectorCredentialField
                key={field.key}
                institutionId={institutionId}
                kind={kind}
                field={field}
              />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
