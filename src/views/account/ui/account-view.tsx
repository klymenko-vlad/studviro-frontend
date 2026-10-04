import { useTranslations } from 'next-intl';

import { LinkedAccounts } from '@/widgets/linked-accounts';
import { MyInstitutions } from '@/widgets/my-institutions';
import { MyRoles } from '@/widgets/my-roles';
import { Link, ROUTES } from '@/shared/config';
import { Button, PageHeader, PageShell } from '@/shared/ui';

export function AccountView() {
  const t = useTranslations('account');

  return (
    <PageShell width="prose">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        actions={
          <Button asChild variant="outline">
            <Link href={ROUTES.accountSettings}>{t('settingsLink')}</Link>
          </Button>
        }
      />

      <MyInstitutions />
      <MyRoles />
      <LinkedAccounts />
    </PageShell>
  );
}
