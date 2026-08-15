import { useTranslations } from 'next-intl';

import { LinkedAccounts } from '@/widgets/linked-accounts';
import { MyInstitutions } from '@/widgets/my-institutions';
import { MyRoles } from '@/widgets/my-roles';

export function AccountView() {
  const t = useTranslations('account');

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-pretty">{t('subtitle')}</p>
      </header>

      <MyInstitutions />
      <MyRoles />
      <LinkedAccounts />
    </main>
  );
}
