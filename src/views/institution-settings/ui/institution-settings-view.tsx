'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { AuditTrail } from '@/widgets/audit-trail';
import { BulkEntry } from '@/widgets/bulk-entry';
import { PageTabs, type PageTab } from '@/widgets/page-tabs';
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
  const hub = useTranslations('hubs.institution');
  const { can, isPending: permissionsPending } = usePermissions(institutionId);
  const mayManage = can('institution:manage');

  const {
    data: configuration,
    isPending,
    refetch,
  } = useQuery({
    ...institutionConfigurationQueries.detail({ path: { institutionId } }),
    enabled: mayManage,
  });

  const tabs: PageTab<'settings' | 'bulk' | 'audit'>[] = [
    ...(mayManage
      ? [
          {
            key: 'settings' as const,
            label: hub('tabs.settings'),
            content: (
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
            ),
          },
        ]
      : []),
    ...(can('offering:manage') || can('program:manage')
      ? [
          {
            key: 'bulk' as const,
            label: hub('tabs.bulk'),
            content: <BulkEntry institutionId={institutionId} />,
          },
        ]
      : []),
    ...(can('audit:read')
      ? [
          {
            key: 'audit' as const,
            label: hub('tabs.audit'),
            content: <AuditTrail institutionId={institutionId} />,
          },
        ]
      : []),
  ];

  return (
    <PageShell width="detail">
      <PageHeader title={hub('title')} description={hub('subtitle')} />

      {permissionsPending ? null : tabs.length > 0 ? (
        <PageTabs tabs={tabs} label={hub('title')} />
      ) : (
        <Alert>
          <AlertTitle>{t('deniedTitle')}</AlertTitle>
          <AlertDescription>{t('deniedDescription')}</AlertDescription>
        </Alert>
      )}
    </PageShell>
  );
}
