# Frontend platform plan

Goal: take `frontend/` from a bare `create-next-app` to the same (or better) engineering
baseline the backend already has, and wire the two together through a generated API contract.

Reference: `../../talendoo/Frontend-RecruitmentERP` (FSD + codegen + i18n, mature but
hand-rolled in places). Backend: `../backend` (NestJS 11 / Fastify, Vitest 4, ESLint flat,
husky + lint-staged + commitlint, Swagger already exposed).

Current state of this repo: Next 16.3, React 19.2, Tailwind 4, React Compiler on,
`eslint-config-next` only. No tests, no formatter, no hooks, no CI, no API layer.

---

## Phase 0 — Baseline hygiene (half a day)

Align with backend so both repos feel identical to work in.

| Concern         | Choice                                                                             | Why                                                                    |
| --------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Package manager | pnpm 10.33.2 (already pinned)                                                      | same as backend                                                        |
| Node            | `.nvmrc` → 22                                                                      | backend requires >=22                                                  |
| Formatting      | Prettier 3 + `@ianvs/prettier-plugin-sort-imports` + `prettier-plugin-tailwindcss` | backend uses Prettier; sorted imports kill a whole class of diff noise |
| Env             | `@t3-oss/env-nextjs` + zod, `src/env.ts`                                           | backend refuses to boot on bad env — frontend should refuse to build   |
| Editor          | `.editorconfig` copied from backend                                                |                                                                        |

Scripts to converge on (mirror backend naming exactly):

```
dev / build / start
lint            eslint . --max-warnings 0 --cache
lint:fix
format / format:check
typecheck       tsc --noEmit
test / test:watch / test:cov
test:e2e        playwright test
verify          lint && typecheck && test:cov && build     <- one command, same as backend
```

## Phase 1 — Lint & static analysis stack

Beyond `eslint-config-next`, layered so each tool owns one job:

1. **ESLint flat config** — `typescript-eslint` (type-aware, `projectService: true`),
   `eslint-plugin-react-hooks` (v6, RSC-aware), `jsx-a11y`, `eslint-plugin-import-x`
   (same as backend, not the legacy `import`), `eslint-config-prettier` last.
   Skip Airbnb — the reference repo carries it and it mostly fights type-aware rules.
2. **`eslint-plugin-boundaries`** or **Steiger** — architecture enforcement (see Phase 2).
3. **Knip** — dead files/exports/deps. Runs in CI, not on commit (too slow).
4. **madge** — `--circular` check, cheap, catches import cycles Next silently tolerates.
5. **`@next/bundle-analyzer`** + **size-limit** with a budget in CI, so a stray
   `import moment` fails the PR instead of shipping.
6. **TypeScript strictness bump**: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
   `noImplicitOverride`, `verbatimModuleSyntax`. Do this before there's code to fix.

Optional but recommended: **Biome** as the _formatter+fast-lint_ and keep ESLint only for
type-aware/architecture rules. Cuts lint time ~10x. Tradeoff: two tools instead of one.
My recommendation: start Prettier+ESLint (matches backend), revisit Biome if lint gets slow.

## Phase 2 — Architecture: Feature-Sliced Design

The reference repo uses FSD and it scales well there. Adopt the same layering so people
can move between the two codebases:

```
src/
  app/          Next.js App Router + providers, styles  (FSD "app" layer)
  views/        page compositions        (FSD renamed "pages" — avoids Next collision)
  widgets/      self-contained UI blocks
  features/     user actions (forms, mutations)
  entities/     domain models + their UI/api
  shared/       ui, lib, config, api  — no upward imports, ever
```

Each slice exposes a public API via `index.ts`; deep imports are a lint error.

Enforcement — **Steiger** (`@feature-sliced/steiger-plugin`) exactly as the reference
configures it, plus `eslint-plugin-boundaries` for the layer-import rule inside ESLint so
violations show in the editor, not just in a separate command.

State/data conventions to fix up front:

- **Server state**: TanStack Query v5 only. No server data in Zustand.
- **Client state**: Zustand, one store per feature slice, no global god-store.
- **Forms**: react-hook-form + zod via `@hookform/resolvers`, schemas derived from the
  generated API types where possible.
- **UI**: shadcn/ui (Radix + CVA + tailwind-merge) into `shared/ui`, owned by us.

## Phase 3 — API generation contract with the backend

This is the part that needs agreement between the repos. The reference implementation
(`openapi-typescript` + ~7 bash scripts post-processing the output) works but is a lot of
bespoke machinery to maintain. Proposal for Studviro:

**Backend side** (`../backend`) — three small additions:

1. `src/openapi.ts` — a script that builds the Nest app via the existing `createApp()`,
   calls `SwaggerModule.createDocument`, writes `openapi.json`, and exits. No HTTP server,
   no database. Add script `"openapi:generate": "tsx src/openapi.ts"`.
   _This is the key decision: generate from code, not by scraping a running `/api/docs/json`._
   CI can then run it with zero infra, and the frontend never needs a live backend.
2. Commit `openapi.json` at the backend root and add a CI step
   `pnpm openapi:generate && git diff --exit-code openapi.json` — the spec can never drift
   from the controllers.
3. Contract quality rules, enforced by review + Spectral lint:
   - every endpoint has an explicit `@ApiOkResponse({ type: XDto })` — no inferred `any`
   - `operationIdFactory` already strips the controller prefix (good); keep operation ids
     unique and verb-shaped (`listUsers`, `createUser`)
   - every DTO is a named class → named schema component (nothing inline/anonymous)
   - `@ApiTags` per module, kebab-case, one tag per controller
   - errors documented with a shared `ErrorResponseDto` so the frontend has one error type
   - `@nestjs/swagger` CLI plugin enabled in `nest-cli.json` so DTO fields don't need
     hand-written decorators

**Frontend side** — use **`@hey-api/openapi-ts`** rather than hand-rolled scripts:

- generates types + a typed SDK + **TanStack Query v5 hooks/query-keys** from the plugin
  ecosystem — this replaces `query-keys.sh`, `server-hooks.sh`, `merge-query-keys.sh`,
  `update-index.sh`, `check-generics.sh` from the reference repo with one config file
- also emits **zod schemas** per DTO (plugin), reusable for form validation
- output to `src/shared/api/generated/**`, gitignored from review via `linguist-generated`,
  excluded from coverage/knip/lint

Source of the spec, in priority order:

1. local path `../backend/openapi.json` when both repos are checked out (monorepo-ish dev)
2. `API_DOCS_URL` env fallback for CI against a deployed env

Handwritten glue stays thin and lives in `src/shared/api/`: an axios/ky client with auth
interceptor + refresh, error normalisation to a `ApiError` type, and the QueryClient config.

CI enforcement, both sides:

- backend PR: spec regenerated and diff-clean
- backend push to `main`: publishes `openapi.json` as an artifact / or the frontend pulls it
- frontend PR: `pnpm api:generate && git diff --exit-code src/shared/api/generated` →
  a backend breaking change turns into a red frontend PR, not a runtime 500.

Add **`openapi-diff`** (or `oasdiff`) in backend CI to label PRs that break the contract.

## Phase 4 — Testing pyramid

All layers, tools chosen to match backend where possible (Vitest 4).

| Layer         | Tool                                                                                            | Scope                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Unit          | **Vitest 4** + `vite-tsconfig-paths`                                                            | pure logic in `shared/lib`, mappers, zod schemas                                    |
| Component     | **Vitest browser mode** (Playwright provider) + Testing Library                                 | real DOM, real CSS, no jsdom lies — this is the modern replacement for jsdom+RTL    |
| Network       | **MSW v2** with handlers **generated from the OpenAPI spec**                                    | one mock source of truth; `msw/node` for unit, `msw/browser` for stories & e2e-lite |
| Visual / docs | **Storybook 9** + `@storybook/addon-a11y` + Chromatic (or `@storybook/test-runner` self-hosted) | catches visual regressions and a11y per component                                   |
| E2E           | **Playwright** — chromium + webkit, traces on failure                                           | critical flows: auth, onboarding, main CRUD                                         |
| a11y          | `@axe-core/playwright` in e2e + Storybook a11y addon                                            | fails the build on serious violations                                               |
| Perf          | **Lighthouse CI** on PR with budgets                                                            | LCP/CLS/TBT regressions blocked                                                     |
| Types         | `tsc --noEmit` + `expect-type` for generated API types                                          | contract stays honest                                                               |
| Coverage      | v8 provider, thresholds start at 60% lines and ratchet up; generated API excluded               | same shape as backend `test:cov`                                                    |

E2E environment: `docker compose` from the backend repo (`pnpm docker:up`) + backend in
test mode, seeded via a `test/seed` endpoint or drizzle fixtures. Playwright `webServer`
starts `next start` against it. Keep a fast MSW-mocked Playwright project for PRs and a
full-stack project for nightly.

## Phase 5 — CI/CD

GitHub Actions, three workflows. Note the backend currently has **no workflows at all**
(`.github/workflows` is empty) — worth fixing in the same pass so both repos share the
same reusable setup action.

**`ci.yml`** (on PR + push to main), jobs in parallel after a shared `install` with pnpm cache:

- `lint` — eslint + prettier check + steiger + madge + knip
- `typecheck`
- `test` — vitest unit + component, coverage upload, threshold gate
- `api-contract` — regenerate from `openapi.json`, `git diff --exit-code`
- `build` — `next build`, then size-limit budget check
- `e2e` — Playwright sharded ×3, artifacts (traces, videos) on failure
- `a11y` + `lighthouse` — non-blocking at first, blocking after baseline settles

**`preview.yml`** — deploy preview per PR, comment the URL, run Lighthouse against it.

**`release.yml`** — on main: changesets or semantic-release for the changelog, build,
deploy to prod, upload sourcemaps to Sentry.

Repo policy: required checks on `main`, squash-merge only, PR template (copy the
reference repo's), CODEOWNERS, Dependabot/Renovate grouped weekly.

## Phase 6 — Commit-time gates (mirror backend exactly)

- **husky**: `pre-commit` → `lint-staged`; `commit-msg` → `commitlint` (conventional);
  `pre-push` → `pnpm typecheck && pnpm test --silent` (cheap gate only, same comment the
  backend hook carries)
- **lint-staged**: `*.{ts,tsx}` → `eslint --fix --max-warnings 0` + `prettier --write`;
  `*.{json,md,yml,css}` → `prettier --write`
- **commitizen** optional (`pnpm commit`)

## Phase 7 — Extras worth having

- **Sentry** (`@sentry/nextjs`) — errors + tracing + session replay, sourcemaps in CI.
  Correlate with backend via the `x-request-id` header the backend already sets.
- **OpenTelemetry** — Next 16 has native instrumentation hooks; ship traces that join the
  backend's pino request ids.
- **i18n from day one** — `next-intl` (App-Router-native; better than the reference repo's
  i18next setup for RSC) + a CI `i18n:check` for missing keys. Retrofitting i18n is misery.
- **Feature flags** — a small typed wrapper now, so the vendor is swappable later.
- **`@next/third-parties`** for any analytics — keeps third-party JS off the critical path.
- **Design tokens** — Tailwind 4 `@theme` CSS variables as the single source, consumed by
  both Tailwind and Storybook.
- **AGENTS.md / CLAUDE.md** — document the FSD rules and the codegen flow so agents and
  humans follow the same conventions (repo already has the Next.js-version note).

---

## Suggested execution order

1. Phase 0 + 6 — hygiene, Prettier, husky, commitlint, `.nvmrc`, env schema. _(1 day)_
2. Phase 1 — lint stack, strict tsconfig. _(1 day)_
3. Phase 2 — FSD skeleton + Steiger + boundaries, shadcn into `shared/ui`. _(1–2 days)_
4. Phase 3 — backend `openapi:generate` + drift check, frontend `@hey-api/openapi-ts`,
   http client, QueryClient. **Needs a backend PR — do it jointly.** _(2 days)_
5. Phase 4 — Vitest + MSW generated handlers + Playwright skeleton + Storybook. _(2 days)_
6. Phase 5 — CI workflows for both repos. _(1 day)_
7. Phase 7 — Sentry, next-intl, budgets. _(ongoing)_

Do 1–4 before writing feature code; 5–7 can land alongside the first features.

## Open decisions for you

1. **Biome vs Prettier+ESLint** — recommendation: Prettier+ESLint (matches backend).
2. **`@hey-api/openapi-ts` vs the reference repo's `openapi-typescript` + bash scripts** —
   recommendation: hey-api, far less to maintain, but it's a different output shape than
   the team may be used to from Talendoo.
3. **i18n now or later** — recommendation: now, with `next-intl`.
4. **Component tests in Vitest browser mode vs jsdom** — recommendation: browser mode.
5. **Backend CI** — it doesn't exist yet; the contract check requires it. Should I write it?
