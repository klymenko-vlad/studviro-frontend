import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';

import { AppProviders } from './_providers';

import './globals.css';

import { env } from '@/env';

import { AppHeader } from '@/widgets/app-header';
import {
  isAppLocale,
  NONCE_HEADER,
  OG_LOCALES,
  THEME_INIT_SCRIPT,
} from '@/shared/config';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'cyrillic'],
});
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('common');

  const title = t('appName');
  const description = t('appDescription');

  return {
    metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
    title: { default: title, template: `%s · ${title}` },
    description,

    /**
     * No `alternates.languages` and no `x-default`: with the locale in a cookie
     * there is exactly one URL per page, so there is no sibling URL to point a
     * crawler at. Declaring hreflang here would advertise URLs that do not
     * exist.
     */
    openGraph: {
      type: 'website',
      siteName: title,
      title,
      description,
      locale: isAppLocale(locale) ? OG_LOCALES[locale] : undefined,
    },

    twitter: { card: 'summary_large_image', title, description },

    // Keeps staging and preview deployments out of search results.
    robots:
      env.NEXT_PUBLIC_ENV === 'production' ? undefined : { index: false, follow: false },
  };
}

/**
 * The browser chrome follows the theme. Declared against the media query rather
 * than the `.dark` class because that is all `theme-color` can key off; the
 * cookie-set class still wins inside the document.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#090b0f' },
  ],
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const locale = await getLocale();
  const t = await getTranslations('common');
  const nonce = (await headers()).get(NONCE_HEADER) ?? undefined;

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Applies the stored theme before first paint. It has to be a blocking
          inline script: any React-driven approach runs after hydration, and the
          user sees a flash of the wrong theme first.

          The nonce comes from `src/proxy.ts` via a request header; without it
          the CSP blocks this script and the page renders in the wrong theme.
        */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <AppProviders>
            {/*
              The first tab stop on every page. Off-screen until focused, which
              is the only way a bypass block is any use (WCAG 2.4.1).
            */}
            <a
              href="#main-content"
              className="bg-background focus-visible:ring-ring/50 sr-only rounded-md border text-sm font-medium shadow-md outline-none focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-50 focus-visible:px-4 focus-visible:py-2 focus-visible:ring-[3px]"
            >
              {t('skipToContent')}
            </a>

            <AppHeader />
            {children}
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
