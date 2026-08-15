'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { ConnectorStatus } from '@/widgets/connector-status';
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
  Skeleton,
} from '@/shared/ui';

export function InstitutionSettingsView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('institutionSettings');
  const { can, isPending: permissionsPending } = usePermissions(institutionId);
  const mayManage = can('institution:manage');

  const { data: configuration, isPending } = useQuery(
    institutionConfigurationQueries.detail({ path: { institutionId } }),
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-pretty">
          {configuration ? configuration.name : t('subtitle')}
        </p>
      </header>

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
                <Alert variant="destructive">
                  <AlertTitle>{t('errorTitle')}</AlertTitle>
                  <AlertDescription>{t('errorDescription')}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('connectorsTitle')}</CardTitle>
              <CardDescription>{t('connectorStatusDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectorStatus institutionId={institutionId} />
            </CardContent>
          </Card>
        </>
      ) : null}
    </main>
  );
}
