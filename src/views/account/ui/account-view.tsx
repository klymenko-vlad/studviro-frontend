import { useTranslations } from 'next-intl';

import { LinkedAccounts } from '@/widgets/linked-accounts';
import { MyDataExport, MyInstitutions } from '@/widgets/my-institutions';
import { Link, ROUTES } from '@/shared/config';
import { initials } from '@/shared/lib';
import { Avatar, AvatarFallback, Button, PageShell } from '@/shared/ui';

/**
 * Where a person lands after signing in: who they are signed in as, the
 * institutions they can open, and the two things about their account that
 * are theirs to manage rather than an institution's.
 */
export function AccountView({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const t = useTranslations('account');

  return (
    <PageShell width="prose">
      <header className="flex flex-wrap items-center gap-4">
        <Avatar className="size-14">
          <AvatarFallback className="text-lg font-semibold">
            {initials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <h1 className="type-title break-words">{displayName}</h1>
          <p className="text-muted-foreground break-all">{email}</p>
        </div>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href={ROUTES.accountSettings}>{t('settingsLink')}</Link>
        </Button>
      </header>

      <MyInstitutions />

      <div className="grid gap-6 sm:grid-cols-2">
        <LinkedAccounts />
        <MyDataExport />
      </div>
    </PageShell>
  );
}
