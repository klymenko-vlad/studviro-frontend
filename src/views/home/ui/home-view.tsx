import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { LANDING_ROUTE, Link, ROUTES } from '@/shared/config';
import { Button } from '@/shared/ui';

/**
 * Page composition for `/`. Views own layout and which widgets appear; they hold
 * no business logic.
 *
 * The call to action depends on whether there is a session, because a landing
 * page that offers "Sign up" to someone already signed in is the fastest way to
 * make an app feel like a set of unconnected screens.
 */
export function HomeView({ signedIn }: { signedIn: boolean }) {
  const t = useTranslations('home');

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-24 text-center">
      <div className="flex max-w-2xl flex-col items-center gap-4">
        <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
          {t('title')}
        </h1>
        <p className="text-muted-foreground max-w-prose text-lg text-pretty">
          {t('subtitle')}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {signedIn ? (
          <Button asChild size="lg">
            <Link href={LANDING_ROUTE}>
              {t('continue')}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        ) : (
          <>
            <Button asChild size="lg">
              <Link href={ROUTES.signUp}>
                {t('getStarted')}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={ROUTES.signIn}>{t('signIn')}</Link>
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
