# Architecture

Next.js App Router + Feature-Sliced Design. Two rules carry most of the weight:
**layers only depend downward**, and **every slice is reached through its `index.ts`**.

## Layers

```
src/
  app/        Next.js routes + app-wide providers   ← may import everything below
  views/      page composition
  widgets/    self-contained UI blocks
  features/   user actions (forms, mutations)
  entities/   domain models and their queries
  shared/     ui, lib, config, api, test          ← may import nothing above
```

A layer may import from any layer **below** it, never above or beside. `shared` is
importable by everyone; `app` by no one.

### Why `views/` and not `pages/`

Canonical FSD names this layer `pages`, but `src/pages` is the Next.js Pages Router
directory and would be picked up as routes. Steiger only recognises the canonical
name, so `src/views` is excluded from its checks and policed by
`eslint-plugin-boundaries` instead.

### `src/app` does double duty

It is both the Next.js routes directory and the FSD `app` layer. Non-routable
concerns live in private folders that Next ignores: `src/app/_providers`.

## Enforcement

| Tool                       | Enforces                                     | Command         |
| -------------------------- | -------------------------------------------- | --------------- |
| `eslint-plugin-boundaries` | Import direction between layers              | `pnpm lint`     |
| Steiger                    | Slice structure, public APIs, segment naming | `pnpm arch`     |
| madge                      | No import cycles                             | `pnpm cycles`   |
| Knip                       | No unused files, exports, or dependencies    | `pnpm deadcode` |

Import direction is checked by ESLint (so it surfaces in the editor) and slice
structure by Steiger (which understands slices). Neither duplicates the other.

## Slice anatomy

```
entities/user/
  index.ts          ← the ONLY entry point other slices may import
  api/              server communication
  model/            types, business logic, stores
  ui/               presentational components
  lib/              slice-local helpers
```

Deep imports (`@/entities/user/model/user`) are a lint error. So is climbing out
with `../../`.

## State

| Kind         | Tool                  | Rule                                           |
| ------------ | --------------------- | ---------------------------------------------- |
| Server state | TanStack Query        | Never mirrored into a client store             |
| Client state | Zustand               | One store per slice, no global god-store       |
| Form state   | react-hook-form + Zod | Schemas derived from the generated API schemas |
| URL state    | `searchParams`        | Anything a user should be able to link to      |

The single most common mistake is copying fetched data into Zustand. Don't — the
cache is already the source of truth, and the copy immediately goes stale.

## Styling

Design tokens live in `src/app/globals.css` in two layers: semantic CSS variables
(`--surface`, `--danger`) mapped to Tailwind utilities via `@theme inline`.
Components reference semantic names only — `bg-surface`, never `bg-white`. A
rebrand is then one file, not a search-and-replace.

## Rendering

Server Components by default. `'use client'` goes as deep in the tree as possible:
mark the interactive leaf, not the page that contains it. `AppProviders` is a
Server Component precisely so page content is not pulled into the client bundle.

## i18n

`next-intl`, with the locale in a `NEXT_LOCALE` cookie rather than in the URL —
one address per page, in every language. See
[ADR 0007](adr/0007-locale-in-cookie.md) for what that trades away.

- `shared/config/i18n/request.ts` resolves it per render: cookie first, then
  `Accept-Language`. `src/proxy.ts` pins the negotiated value on the first visit
  and sets `Vary: Cookie, Accept-Language`.
- For a signed-in user the cookie caches `users.locale`; `features/switch-locale`
  writes both, and signing in overwrites the cookie from the account.
- Navigate with `Link`/`useRouter` from `@/shared/config`. They are the plain Next
  primitives now, but the barrel is the seam a future routing change goes through.
- `next.config.ts` generates `messages/en.d.json.ts`, so an unknown message key is
  a type error.

## Authentication

The API issues JWT access and refresh tokens; the Next server holds them, the
browser never does. See [ADR 0008](adr/0008-bff-token-cookies.md).

- `src/app/api/auth/*` exchange credentials for httpOnly cookies (`sv_at` on `/`,
  `sv_rt` scoped to `/api/auth`).
- `src/app/api/proxy/[...path]` carries browser-side API calls, attaching the
  bearer token server-side — so `connect-src` stays `'self'`.
- `shared/auth` resolves and transparently refreshes the session on the server;
  `entities/session` exposes the resulting user to client components.

## Testing

| Layer     | Tool                                  | What it proves                                               |
| --------- | ------------------------------------- | ------------------------------------------------------------ |
| Unit      | Vitest                                | Logic in `shared/lib`, `model/`, schemas                     |
| Component | Vitest + Testing Library (jsdom)      | Behaviour and accessibility of a component                   |
| Network   | MSW v2                                | Handlers typed against generated DTOs, so mocks cannot drift |
| E2E       | Playwright (chromium, webkit, mobile) | Real routing, headers, locales                               |
| a11y      | axe via Playwright                    | No serious/critical WCAG violations                          |

Component tests query by role and label, never by class name or test id unless
there is no accessible alternative — a test that can only find an element by
`.btn-primary` is not testing what the user experiences.

Coverage thresholds start at 60% and ratchet up. Generated code is excluded.
