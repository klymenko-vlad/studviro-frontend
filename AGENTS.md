# AGENTS.md

Instructions for AI agents working in this repository. This file governs _how code is
written here_.

## Delivery flow

_How work is delivered_ — the loop from picking a step to marking it `Done` across both
repositories — lives in the `ship-backlog-step` skill at
`../.claude/skills/ship-backlog-step/SKILL.md`. Read it before starting feature work,
and treat "continue development" as an instruction to run it for one step.

This repository is the client half. The API, the backlog and every planning document
live in `../backend` — `docs/STATUS.md` is the entry point, `docs/Feature Status.md` the
product view, `docs/Task Tracker.md` the delivery view. A frontend change that completes
a step updates them in the backend repository as part of the same piece of work.

## Test-driven development

Use test-driven development when adding or changing behavior:

1. Write tests for the expected behavior before implementing it.
2. Cover representative positive, negative, boundary and failure cases.
3. Confirm the tests fail for the expected reason.
4. Implement the smallest complete change that makes them pass.
5. Refactor while keeping the full suite green.

Test observable behavior, not implementation details. Keep tests focused and
independent, query UI by role and label, and reproduce bugs with a regression
test before fixing them.

## Repository rules

- Layers depend downward: `app → views → widgets → features → entities → shared`.
- Import slices through `index.ts`; do not deep-import or climb with `../../`.
- Do not edit `src/shared/api/generated/` or import from it directly. Regenerate
  it with `pnpm api:generate` and import through `@/shared/api`.
- Derive form validation from `apiSchemas.*` and wrap generated query options;
  do not duplicate schemas or query keys.
- Put user-facing text in both `messages/en.json` and `messages/uk.json`. Never
  hard-code a string in a component; everything a user reads goes through a key.
- **Do not translate.** Write the real copy in `en.json` and mirror the key into
  `uk.json` with the English string copied verbatim. Extraction and wiring are
  the job; translation is a later pass done deliberately, not a side effect of
  building a feature. `pnpm i18n:check` demands the key exists and is non-empty,
  which a verbatim copy satisfies, and the keys still awaiting translation are
  exactly those whose `uk` value equals its `en` value. Leave the Ukrainian text
  that is already translated alone.
- Use Server Components by default and keep `'use client'` at the smallest
  interactive boundary.
- Navigate with `Link` and `useRouter` from `@/shared/config`.
- Use `logger` from `@/shared/lib`, never `console`.
- Tokens stay server-side in `/api/auth/*` and `shared/auth/`. Browser code uses
  `/api/proxy`; never expose tokens through storage, readable cookies or props.
- Inline scripts need the request nonce from `src/proxy.ts`. Prefer external
  modules and never add a CSP script hash.

## UI

- Reuse shadcn primitives from `@/shared/ui`; do not hand-roll equivalents,
  deep-import UI files or import Radix directly from features.
- Add primitives with `pnpm dlx shadcn@latest add <component>`, then export only
  adopted components from `src/shared/ui/index.ts`.
- Use `className` on primitives for layout, not visual redesign. Add reusable
  variants at the primitive level.
- Preserve the marked local shadcn deviations in `button.tsx`, `form.tsx` and
  `sonner.tsx` when regenerating components.
- Use semantic colour tokens, define new tokens in both `:root` and `.dark`, and
  verify both themes.
- Build accessible, responsive interfaces with visible interaction states and
  reduced-motion support.
- Mirror provider-backed primitives in `AppProviders` and `renderWithProviders`.

## Features

Use `features` for actions, `entities` for domain concepts, `widgets` for
composite blocks and `views` for page composition. Export only the public API.
Do not silence validation rules merely to make checks pass.

## Comments

Avoid comments. Prefer clear naming, decomposition and types. Keep only comments
required by tooling or those that explain a genuinely non-obvious constraint.

## Next.js version

- Middleware lives in `src/proxy.ts`.
- `params` and `searchParams` are promises.
- Locale comes from the `NEXT_LOCALE` cookie; there is no locale route segment.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
