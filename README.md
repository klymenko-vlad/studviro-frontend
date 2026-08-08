# Studviro — frontend

Next.js 16 (App Router, Turbopack, React Compiler) · React 19 · TypeScript ·
Tailwind 4 · TanStack Query · next-intl · Feature-Sliced Design.

## Getting started

```bash
nvm use                      # Node 22
pnpm install
cp .env.example .env         # defaults assume the backend on :3000
pnpm dev                     # http://localhost:3001
```

The backend runs on `:3000`, so this app takes `:3001`.

To talk to a real API, start the backend (`cd ../backend && pnpm docker:up && pnpm start:dev`)
and generate the client:

```bash
cd ../backend && pnpm openapi:generate
cd ../frontend && pnpm api:generate
```

## Commands

|                                         |                                                 |
| --------------------------------------- | ----------------------------------------------- |
| `pnpm dev` / `build` / `start`          | Run, build, serve                               |
| `pnpm verify`                           | Everything CI runs, in one command              |
| `pnpm lint` / `lint:fix`                | ESLint (type-aware, a11y, FSD boundaries)       |
| `pnpm format` / `format:check`          | Prettier                                        |
| `pnpm typecheck`                        | `tsc --noEmit`                                  |
| `pnpm test` / `test:watch` / `test:cov` | Vitest                                          |
| `pnpm test:e2e` / `test:e2e:ui`         | Playwright (run `test:e2e:install` once)        |
| `pnpm arch`                             | Steiger — FSD structure                         |
| `pnpm cycles`                           | madge — import cycles                           |
| `pnpm deadcode`                         | Knip — unused files, exports, deps              |
| `pnpm size`                             | Bundle budget                                   |
| `pnpm analyze`                          | Bundle treemap                                  |
| `pnpm api:generate` / `api:check`       | Regenerate the API client from the backend spec |

## Structure

```
src/
  app/        Next.js routes, providers, global styles
  views/      page composition
  widgets/    composite UI blocks
  features/   user actions
  entities/   domain models
  shared/     ui, lib, config, api, test
messages/     translation catalogues
e2e/          Playwright specs
docs/         architecture.md, api-contract.md, platform-plan.md
```

Layers depend downward only, and slices are imported through their `index.ts`.
Both rules are enforced in CI — see [docs/architecture.md](docs/architecture.md).

## The API layer is generated

Types, SDK, Zod schemas and TanStack Query hooks all come from the backend's
`openapi.json`. Do not edit `src/shared/api/generated/`, and import through
`@/shared/api`. See [docs/api-contract.md](docs/api-contract.md).

## Conventions

- **Server Components by default.** Push `'use client'` to the interactive leaf.
- **No hard-coded user-facing strings.** Everything goes through `messages/*.json`.
- **Semantic design tokens only** — `bg-surface`, not `bg-white`.
- **Navigate via `@/shared/config`**, not bare `next/link` — the barrel is the
  seam a routing change goes through.
- **Conventional Commits**, enforced by commitlint on `commit-msg`.

## Before you push

`pre-commit` runs lint-staged; `pre-push` runs typecheck and unit tests. The full
gate is `pnpm verify`, which is what CI runs.
