export const LOCALES = ['en', 'sk'] as const;
export const DEFAULT_LOCALE = 'en' satisfies (typeof LOCALES)[number];

export type AppLocale = (typeof LOCALES)[number];

/**
 * Outside an institution's screens there is no institution clock to follow;
 * inside them `InstitutionTimeZone` switches to the institution's own.
 */
export const DEFAULT_TIME_ZONE = 'Europe/Bratislava';

/**
 * Cookie the resolved locale is cached in. Read by `request.ts` on every render
 * and by `src/proxy.ts`; written by the locale switcher and by sign-in, which
 * replaces it with the value stored on the account.
 *
 * `NEXT_LOCALE` is next-intl's conventional name, kept so its own middleware
 * and any future tooling agree with us about where the locale lives.
 */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

/** A year. The preference is not a session concern — it should outlive one. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Picks the best supported locale from an `Accept-Language` header.
 *
 * Only used when the cookie is absent — a first visit, or a visitor who has
 * never chosen. Hand-rolled rather than pulled from `@formatjs/intl-localematcher`
 * because this runs in the proxy on every uncookied request, and the whole
 * grammar we need is "quality-ordered tags, match on the primary subtag".
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): AppLocale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const ranked = acceptLanguage
    .split(',')
    .map(part => {
      const [tag = '', ...parameters] = part.trim().split(';');
      const declared = parameters.find(parameter => /^\s*q=/i.test(parameter));
      const parsed = declared === undefined ? 1 : Number(declared.split('=')[1]);

      /**
       * A `q` that is present but unparseable means a malformed header, not an
       * emphatic preference. Ranking it last is the conservative reading —
       * defaulting it to 1 would let `en;q=garbage` beat a legitimate `sk;q=0.9`.
       */
      return {
        tag: tag.trim().toLowerCase(),
        quality: Number.isFinite(parsed) ? parsed : 0,
      };
    })
    .filter(entry => entry.tag.length > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    // `sk-SK` and `sk` must both match, but `en` must not match `sk-en-x`.
    const primary = tag.split('-')[0];
    if (isAppLocale(primary)) return primary;
  }

  return DEFAULT_LOCALE;
}
