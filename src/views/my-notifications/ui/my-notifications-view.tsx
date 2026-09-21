'use client';

import { useTranslations } from 'next-intl';

import { MyNotifications } from '@/widgets/my-notifications';
import { usePermissions } from '@/entities/permission';
import { Alert, AlertDescription, AlertTitle, PageHeader, PageShell } from '@/shared/ui';

export function MyNotificationsView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('notifications');
  const { can, isPending } = usePermissions(institutionId);

  return (
    <PageShell width="detail">
      <PageHeader title={t('title')} description={t('subtitle')} />

      {isPending ? null : can('notification:read') ? (
        <MyNotifications institutionId={institutionId} />
      ) : (
        <Alert>
          <AlertTitle>{t('deniedTitle')}</AlertTitle>
          <AlertDescription>{t('deniedDescription')}</AlertDescription>
        </Alert>
      )}
    </PageShell>
  );
}
