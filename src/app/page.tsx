import type { Metadata } from 'next';
import { env } from '@/env';
import { getTranslations } from 'next-intl/server';

import { HomeView } from '@/views/home';
import { getCurrentUser } from '@/shared/auth';
import { ROUTES } from '@/shared/config';
import { JsonLd } from '@/shared/seo';

/**
 * Route files stay this thin on purpose: they map a URL to a view and nothing
 * else, so page composition stays testable without the Next.js router.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('home');

  return {
    description: t('subtitle'),
    alternates: { canonical: ROUTES.home },
    openGraph: { description: t('subtitle'), url: ROUTES.home },
  };
}

export default async function HomePage() {
  const [common, home] = await Promise.all([
    getTranslations('common'),
    getTranslations('home'),
  ]);
  const url = env.NEXT_PUBLIC_APP_URL;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              '@id': `${url}#organization`,
              name: common('appName'),
              url,
              description: home('subtitle'),
            },
            {
              '@type': 'WebSite',
              '@id': `${url}#website`,
              name: common('appName'),
              url,
              publisher: { '@id': `${url}#organization` },
            },
          ],
        }}
      />
      <HomeView signedIn={(await getCurrentUser()) !== undefined} />
    </>
  );
}
