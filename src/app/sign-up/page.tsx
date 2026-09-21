import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { AcceptInvitationForm } from '@/features/accept-invitation';
import { SignUp } from '@/features/sign-up';
import { captchaEnabled, getCurrentUser, safeNext } from '@/shared/auth';
import { LANDING_ROUTE, Link, ROUTES } from '@/shared/config';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');

  return { title: t('signUpTitle') };
}

export default async function SignUpPage({ searchParams }: PageProps<'/sign-up'>) {
  if (await getCurrentUser()) redirect(LANDING_ROUTE);

  const { next, invitation } = await searchParams;
  const token = Array.isArray(invitation) ? invitation[0] : invitation;

  if (token) {
    const t = await getTranslations('invitation');

    return (
      <main
        id="main-content"
        className="flex flex-1 flex-col items-center justify-center gap-6 p-8"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        <AcceptInvitationForm token={token} />
      </main>
    );
  }

  const t = await getTranslations('auth');

  return (
    <main
      id="main-content"
      className="flex flex-1 flex-col items-center justify-center gap-6 p-8"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold">{t('signUpTitle')}</h1>
        <p className="text-muted-foreground">{t('signUpSubtitle')}</p>
      </div>

      <SignUp next={safeNext(next)} captchaEnabled={await captchaEnabled()} />

      <p className="text-muted-foreground text-sm">
        {t('haveAccount')}{' '}
        <Link
          href={ROUTES.signIn}
          className="text-foreground underline underline-offset-4"
        >
          {t('signIn')}
        </Link>
      </p>
    </main>
  );
}
