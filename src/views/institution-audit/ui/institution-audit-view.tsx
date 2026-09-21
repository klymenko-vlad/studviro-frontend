'use client';

import { useTranslations } from 'next-intl';

import { AuditTrail } from '@/widgets/audit-trail';
import { usePermissions } from '@/entities/permission';
import { Alert, AlertDescription, AlertTitle, PageHeader, PageShell } from '@/shared/ui';

export function InstitutionAuditView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('audit');
  const { can, isPending } = usePermissions(institutionId);

  return (
    <PageShell width="detail">
      <PageHeader title={t('title')} description={t('subtitle')} />

      {isPending ? null : can('audit:read') ? (
        <AuditTrail institutionId={institutionId} />
      ) : (
        <Alert>
          <AlertTitle>{t('deniedTitle')}</AlertTitle>
          <AlertDescription>{t('deniedDescription')}</AlertDescription>
        </Alert>
      )}
    </PageShell>
  );
}
