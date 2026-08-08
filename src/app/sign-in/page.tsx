import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { SignIn } from '@/features/sign-in';
import { getCurrentUser } from '@/shared/auth';
import { ROUTES } from '@/shared/config';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');

  return { title: t('signInTitle') };
}

export default async function SignInPage({ searchParams }: PageProps<'/sign-in'>) {
  // Someone already signed in has no business on this form; sending them on is
  // better than showing a form that would sign them in as themselves again.
  // `home`, not `dashboard`, for as long as there is no dashboard to land on.
  if (await getCurrentUser()) redirect(ROUTES.home);

  const { next } = await searchParams;
  const t = await getTranslations('auth');

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold">{t('signInTitle')}</h1>
        <p className="text-muted-foreground">{t('signInSubtitle')}</p>
      </div>

      <SignIn next={safeNext(next)} />
    </main>
  );
}

/**
 * `next` arrives from the query string and is handed to `router.push`, so it is
 * an open-redirect sink. Only a same-site absolute path is accepted: `//evil.com`
 * is protocol-relative and would navigate off-site despite starting with a slash.
 */
function safeNext(next: string | string[] | undefined): string | undefined {
  if (typeof next !== 'string') return undefined;

  return next.startsWith('/') && !next.startsWith('//') ? next : undefined;
}
