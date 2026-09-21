'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { InstitutionConfigurationForm } from '@/features/edit-institution-configuration';
import { institutionConfigurationQueries } from '@/entities/institution-configuration';
import { usePermissions } from '@/entities/permission';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
  PageShell,
  QueryError,
  Skeleton,
} from '@/shared/ui';

export function InstitutionSettingsView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('institutionSettings');
  const { can, isPending: permissionsPending } = usePermissions(institutionId);
  const mayManage = can('institution:manage');

  const {
    data: configuration,
    isPending,
    refetch,
  } = useQuery(institutionConfigurationQueries.detail({ path: { institutionId } }));

  return (
    <PageShell width="detail">
      <PageHeader
        title={t('title')}
        description={configuration ? configuration.name : t('subtitle')}
      />

      {!permissionsPending && !mayManage ? (
        <Alert>
          <AlertTitle>{t('deniedTitle')}</AlertTitle>
          <AlertDescription>{t('deniedDescription')}</AlertDescription>
        </Alert>
      ) : null}

      {mayManage ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('configurationTitle')}</CardTitle>
              <CardDescription>{t('configurationDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <Skeleton className="h-64 w-full" />
              ) : configuration ? (
                <InstitutionConfigurationForm
                  institutionId={institutionId}
                  configuration={configuration}
                />
              ) : (
                <QueryError
                  onRetry={refetch}
                  title={t('errorTitle')}
                  description={t('errorDescription')}
                />
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </PageShell>
  );
}
