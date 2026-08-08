import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

import { isAppLocale, LOCALE_COOKIE, negotiateLocale } from './routing';

/**
 * Resolves the locale and loads its catalogue for every server render.
 * Wired up via `requestConfig` in next.config.ts.
 *
 * The cookie is the source of truth for the request; for a signed-in user it is
 * itself a cache of `users.locale`, rewritten at sign-in and whenever the
 * switcher runs. `Accept-Language` only covers the first visit, before anyone
 * has chosen anything.
 *
 * Reading either one opts the render into dynamic rendering. That is the
 * deliberate trade for URLs without a locale segment — see
 * `docs/adr/0007-locale-in-cookie.md`.
 */
export default getRequestConfig(async () => {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;

  const locale = isAppLocale(stored)
    ? stored
    : negotiateLocale((await headers()).get('accept-language'));

  return {
    locale,
    messages: (
      (await import(`../../../../messages/${locale}.json`)) as {
        default: Record<string, unknown>;
      }
    ).default,
    // Pin these so a server in UTC and a browser in Kyiv format dates identically.
    timeZone: 'Europe/Kyiv',
    now: new Date(),
  };
});
