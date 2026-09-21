import { useTranslations } from 'next-intl';

import { LinkedAccounts } from '@/widgets/linked-accounts';
import { MyInstitutions } from '@/widgets/my-institutions';
import { MyRoles } from '@/widgets/my-roles';
import { PageHeader, PageShell } from '@/shared/ui';

export function AccountView() {
  const t = useTranslations('account');

  return (
    <PageShell width="prose">
      <PageHeader title={t('title')} description={t('subtitle')} />

      <MyInstitutions />
      <MyRoles />
      <LinkedAccounts />
    </PageShell>
  );
}
