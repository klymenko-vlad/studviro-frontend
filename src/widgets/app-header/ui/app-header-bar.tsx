import { useTranslations } from 'next-intl';

import { Link, ROUTES } from '@/shared/config';
import { Button, Logo } from '@/shared/ui';

import { AccountMenu } from './account-menu';
import { MARKETING_LINKS } from './marketing-links';
import { MobileMenu } from './mobile-menu';
import { PreferencesMenu } from './preferences-menu';

/**
 * The presentational half, split from the session lookup so it renders in a
 * test without a cookie jar or a stubbed API.
 *
 * Sticky, one fixed row, aligned to the same `max-w-6xl` gutter every page
 * uses so the brand sits directly above the page title. It never wraps: what a
 * narrow screen cannot hold goes into the sheet or the account menu rather
 * than onto a second line. Beside an institution's sidebar the page is no
 * longer centred, so the bar spans the window and the brand sits above the
 * sidebar instead.
 */
export function AppHeaderBar({
  signedIn,
  displayName,
  email,
  isPlatformOperator = false,
}: {
  signedIn: boolean;
  displayName?: string;
  email?: string;
  isPlatformOperator?: boolean;
}) {
  const t = useTranslations('nav');
  const marketing = useTranslations('marketing');

  return (
    <header
      data-translucent
      className="bg-background/80 border-border/60 sticky top-0 z-40 border-b backdrop-blur-md"
    >
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-6 [body:has([data-institution-frame])_&]:lg:max-w-none">
        <Link
          href={ROUTES.home}
          aria-label={t('home')}
          className="focus-visible:ring-ring/50 rounded-md outline-none focus-visible:ring-[3px]"
        >
          <Logo />
        </Link>

        {/*
          Marketing navigation belongs to visitors who have not signed in; a
          signed-in header is about the app, not about the product.
        */}
        {signedIn ? null : (
          <nav
            aria-label={marketing('nav.sectionLabel')}
            className="ml-6 hidden items-center gap-1 md:flex"
          >
            {MARKETING_LINKS.map(link => (
              <Button key={link.key} asChild variant="ghost" size="sm">
                <Link href={link.href}>{marketing(`nav.${link.key}`)}</Link>
              </Button>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1">
          {signedIn ? (
            <AccountMenu
              displayName={displayName ?? ''}
              email={email ?? ''}
              isPlatformOperator={isPlatformOperator}
            />
          ) : (
            <>
              <PreferencesMenu />
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href={ROUTES.signIn}>{t('signIn')}</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href={ROUTES.signUp}>{t('signUp')}</Link>
              </Button>
              <MobileMenu />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
