# 0007. Locale in a cookie, not in the URL

- **Status**: accepted
- **Date**: 2026-08-08

## Context

The locale used to be the first path segment: `next-intl`'s `as-needed` scheme
served English at `/dashboard` and Ukrainian at `/uk/dashboard`, resolved by
`createIntlMiddleware` in `src/proxy.ts` and read during render from
`next/root-params`.

That bought two real things: every locale prerendered at build time, and one
addressable, indexable URL per language.

It also meant the language was a property of the address rather than of the
person. A signed-in user who prefers Ukrainian got English on any link anyone
sent them; switching language rewrote the URL, so a shared link carried the
sender's language to the recipient; and every internal `href` had to go through
locale-aware `Link`/`useRouter` wrappers, because the bare Next primitives
silently dropped the prefix. That last one is a footgun that only shows up as a
language flipping back on one stray link.

With accounts arriving (see [0008](./0008-bff-token-cookies.md)), the preference
also has to live on the user record so it follows them between devices — at
which point the URL is a third place the same fact is stored.

## Decision

Resolve the locale from a `NEXT_LOCALE` cookie. Remove the `[locale]` route
segment entirely; there is one URL per page.

- `shared/config/i18n/request.ts` reads the cookie, falling back to negotiating
  `Accept-Language`.
- `src/proxy.ts` pins the negotiated value on the first visit, so the choice is
  stable from the second request onward.
- For a signed-in user the cookie is a _cache_ of `users.locale`. The switcher
  writes both; signing in overwrites the cookie from the account.
- `shared/config/i18n/navigation.ts` now re-exports the plain Next primitives.
  The barrel stays, so a future change of strategy touches one file.

## Consequences

- **Pages are dynamic.** Reading a cookie during render opts every route out of
  static generation. Accepted: the app is authenticated almost everywhere, so
  most routes were headed for dynamic rendering regardless.
- **No per-locale SEO.** `hreflang`, `x-default` and per-locale sitemap entries
  are gone, along with `localePath`. Two languages now share one URL, so a
  crawler indexes whichever the negotiation gives it. If organic search in
  Ukrainian ever matters commercially, this decision has to be revisited — most
  likely by reintroducing prefixed URLs for public marketing pages only, while
  the authenticated app keeps the cookie.
- A shared link now renders in the _recipient's_ language, which is what people
  usually expect, and is the mirror image of the old complaint.
- Caching gets more delicate, and the usual lever is unavailable: Next writes its
  own `Vary` for App Router responses and discards anything middleware or
  `next.config.ts` sets, so `Vary: Cookie` cannot be added. What keeps a shared
  cache honest is that every page is now dynamic and therefore served
  `Cache-Control: no-cache, must-revalidate`. A CDN configured to override that
  would serve one visitor's language to everyone behind it — so don't.
