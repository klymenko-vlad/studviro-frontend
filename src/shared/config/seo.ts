import type { AppLocale } from './i18n/routing';

/**
 * BCP-47 tags for Open Graph, which wants `en_US`-style locales rather than the
 * bare language codes used everywhere else.
 */
export const OG_LOCALES: Record<AppLocale, string> = {
  en: 'en_US',
  sk: 'sk_SK',
};
