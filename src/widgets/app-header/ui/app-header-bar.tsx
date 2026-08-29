import { useTranslations } from 'next-intl';

import { SignOut } from '@/features/sign-out';
import { SwitchLocale } from '@/features/switch-locale';
import { ThemeToggle } from '@/features/theme-toggle';
import { Link, ROUTES } from '@/shared/config';
import { Button } from '@/shared/ui';

/**
 * The presentational half, split from the session lookup so it renders in a test
 * without a cookie jar or a stubbed API.
 */
export function AppHeaderBar({ signedIn }: { signedIn: boolean }) {
  const t = useTranslations('nav');
  const common = useTranslations('common');

  return (
    <header className="border-border/60 flex items-center gap-2 border-b px-4 py-3">
      <Link href={ROUTES.home} className="mr-auto font-semibold tracking-tight">
        {common('appName')}
      </Link>

      {signedIn ? (
        <>
          <Button asChild variant="ghost" size="sm">
            <Link href={ROUTES.account}>{t('account')}</Link>
          </Button>
          <SignOut />
        </>
      ) : (
        <>
          <Button asChild variant="ghost" size="sm">
            <Link href={ROUTES.signIn}>{t('signIn')}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={ROUTES.signUp}>{t('signUp')}</Link>
          </Button>
        </>
      )}

      <SwitchLocale />
      <ThemeToggle />
    </header>
  );
}
