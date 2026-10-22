import { useTranslations } from 'next-intl';

import { ChangePassword } from '@/features/change-password';
import { EditProfile } from '@/features/edit-profile';
import { ManageNotificationMail } from '@/features/manage-notification-mail';
import { ManageSessions } from '@/features/manage-sessions';
import { ManageTwoFactor } from '@/features/manage-two-factor';
import { PageHeader, PageShell } from '@/shared/ui';

export function AccountSettingsView({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const t = useTranslations('accountSettings');

  return (
    <PageShell width="prose">
      <PageHeader title={t('title')} description={t('subtitle')} />

      <EditProfile displayName={displayName} email={email} />
      <ChangePassword />
      <ManageTwoFactor />
      <ManageSessions />
      <ManageNotificationMail />
    </PageShell>
  );
}
