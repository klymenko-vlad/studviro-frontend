import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { RequestPasswordResetForm } from '@/features/request-password-reset';
import { captchaEnabled, getCurrentUser } from '@/shared/auth';
import { LANDING_ROUTE, Link, ROUTES } from '@/shared/config';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('passwordReset');

  return { title: t('requestTitle') };
}

export default async function ForgotPasswordPage() {
  if (await getCurrentUser()) redirect(LANDING_ROUTE);

  const t = await getTranslations('passwordReset');

  return (
    <main
      id="main-content"
      className="flex flex-1 flex-col items-center justify-center gap-6 p-8"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="type-title text-2xl">{t('requestTitle')}</h1>
        <p className="text-muted-foreground">{t('requestSubtitle')}</p>
      </div>

      <RequestPasswordResetForm captchaEnabled={await captchaEnabled()} />

      <p className="text-muted-foreground text-sm">
        <Link
          href={ROUTES.signIn}
          className="text-foreground underline underline-offset-4"
        >
          {t('backToSignIn')}
        </Link>
      </p>
    </main>
  );
}
