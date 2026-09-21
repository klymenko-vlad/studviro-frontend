import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { SignIn } from '@/features/sign-in';
import { captchaEnabled, getCurrentUser, safeNext } from '@/shared/auth';
import { LANDING_ROUTE, Link, ROUTES } from '@/shared/config';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');

  return { title: t('signInTitle') };
}

export default async function SignInPage({ searchParams }: PageProps<'/sign-in'>) {
  // Someone already signed in has no business on this form; sending them on is
  // better than showing a form that would sign them in as themselves again.
  if (await getCurrentUser()) redirect(LANDING_ROUTE);

  const { next } = await searchParams;
  const t = await getTranslations('auth');

  return (
    <main
      id="main-content"
      className="flex flex-1 flex-col items-center justify-center gap-6 p-8"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="type-title text-2xl">{t('signInTitle')}</h1>
        <p className="text-muted-foreground">{t('signInSubtitle')}</p>
      </div>

      <SignIn next={safeNext(next)} captchaEnabled={await captchaEnabled()} />

      <p className="text-muted-foreground text-sm">
        <Link
          href={ROUTES.forgotPassword}
          className="text-foreground underline underline-offset-4"
        >
          {t('forgotPassword')}
        </Link>
      </p>

      <p className="text-muted-foreground text-sm">
        {t('noAccount')}{' '}
        <Link
          href={ROUTES.signUp}
          className="text-foreground underline underline-offset-4"
        >
          {t('signUp')}
        </Link>
      </p>
    </main>
  );
}
