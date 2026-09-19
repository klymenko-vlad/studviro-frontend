import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { ConfirmPasswordResetForm } from '@/features/confirm-password-reset';
import { getCurrentUser } from '@/shared/auth';
import { LANDING_ROUTE } from '@/shared/config';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('passwordReset');

  return { title: t('confirmTitle') };
}

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<'/reset-password'>) {
  if (await getCurrentUser()) redirect(LANDING_ROUTE);

  const { token } = await searchParams;
  const rawToken = Array.isArray(token) ? token[0] : token;
  const t = await getTranslations('passwordReset');

  return (
    <main
      id="main-content"
      className="flex flex-1 flex-col items-center justify-center gap-6 p-8"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold">{t('confirmTitle')}</h1>
        <p className="text-muted-foreground">{t('confirmSubtitle')}</p>
      </div>

      {rawToken ? (
        <ConfirmPasswordResetForm token={rawToken} />
      ) : (
        <Alert variant="destructive" className="w-full max-w-sm">
          <AlertTitle>{t('invalidTitle')}</AlertTitle>
          <AlertDescription>{t('invalidDescription')}</AlertDescription>
        </Alert>
      )}
    </main>
  );
}
