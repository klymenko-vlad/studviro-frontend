import { useTranslations } from 'next-intl';

import { SignOut } from '@/features/sign-out';
import { SwitchLocale } from '@/features/switch-locale';
import { ThemeToggle } from '@/features/theme-toggle';
import { Link, ROUTES } from '@/shared/config';
import { Button } from '@/shared/ui';

const MARKETING_LINKS = [
  { key: 'forStudents', href: ROUTES.forStudents },
  { key: 'forTeachers', href: ROUTES.forTeachers },
  { key: 'forInstitutions', href: ROUTES.forInstitutions },
] as const;

/**
 * The presentational half, split from the session lookup so it renders in a test
 * without a cookie jar or a stubbed API.
 */
export function AppHeaderBar({
  signedIn,
  isPlatformOperator = false,
}: {
  signedIn: boolean;
  isPlatformOperator?: boolean;
}) {
  const t = useTranslations('nav');
  const common = useTranslations('common');
  const marketing = useTranslations('marketing');

  return (
    <header className="border-border/60 flex flex-wrap items-center gap-2 border-b px-4 py-3">
      <Link href={ROUTES.home} className="font-semibold tracking-tight">
        {common('appName')}
      </Link>

      {/*
        Marketing navigation belongs to visitors who have not signed in; a
        signed-in header is about the app, not about the product. Hidden on
        narrow screens, where the footer carries the same links.
      */}
      {signedIn ? null : (
        <nav
          aria-label={marketing('nav.sectionLabel')}
          className="ml-4 hidden items-center gap-1 md:flex"
        >
          {MARKETING_LINKS.map(link => (
            <Button key={link.key} asChild variant="ghost" size="sm">
              <Link href={link.href}>{marketing(`nav.${link.key}`)}</Link>
            </Button>
          ))}
        </nav>
      )}

      <div className="ml-auto" />

      {signedIn ? (
        <>
          {isPlatformOperator ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={ROUTES.createInstitution}>{t('createInstitution')}</Link>
            </Button>
          ) : null}
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
