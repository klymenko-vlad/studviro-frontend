# AGENTS.md

Next.js 16 App Router · Feature-Sliced Design · shadcn. Acts as the BFF. The API, the
backlog and every planning document live in `../backend`.

## Delivery

- The loop from picking a step to marking it `Done` is the `ship-backlog-step` skill
  (`../.claude/skills/ship-backlog-step/SKILL.md`). Read it before feature work.
- "continue development" = run that loop for exactly one step.
- `../backend/docs/STATUS.md` is the entry point. A change here that completes a step
  updates the backend's trackers as part of the same work.

## Tests

Test-driven, always: failing test first, then the smallest change that passes it, then
refactor green. Cover positive, negative, boundary and failure cases. Query UI by role and
label. Reproduce every bug with a regression test before fixing it.

## Architecture

- Layers depend downward: `app → views → widgets → features → entities → shared`.
- `features` are actions, `entities` domain concepts, `widgets` composite blocks, `views`
  page composition. Import through `index.ts` — no deep imports, no `../../`.
- Never edit or import `src/shared/api/generated/`. Regenerate with `pnpm api:generate`,
  import through `@/shared/api`.
- Derive form validation from `apiSchemas.*` and wrap generated query options. Do not
  duplicate schemas or query keys.
- Server Components by default; `'use client'` at the smallest interactive boundary.
- `Link` and `useRouter` from `@/shared/config`. `logger` from `@/shared/lib`, never
  `console`.
- Never silence a validation rule to make a check pass.

## Security

- Tokens stay server-side in `/api/auth/*` and `shared/auth/`. Browser code uses
  `/api/proxy`. Never expose a token through storage, a readable cookie or a prop.
- Inline scripts need the request nonce from `src/proxy.ts`. Prefer external modules;
  never add a CSP script hash.

## UI

- Reuse `@/shared/ui` primitives. Do not hand-roll equivalents, deep-import UI files or
  import Radix from features.
- Add primitives with `pnpm dlx shadcn@latest add <component>`, then export adopted ones
  from `src/shared/ui/index.ts`. Preserve the marked local deviations in `button.tsx`,
  `form.tsx` and `sonner.tsx` when regenerating.
- `className` on primitives is for layout, not visual redesign; reusable variants belong
  at the primitive level.
- Semantic colour tokens only; define new ones in both `:root` and `.dark` and check both.
- Accessible and responsive, with visible interaction states and reduced-motion support.
- Mirror provider-backed primitives in `AppProviders` and `renderWithProviders`.

## Strings

- Every user-facing string goes through a key in both `messages/en.json` and
  `messages/sk.json`. Never hard-code one in a component.
- **Do not translate.** Real copy in `en.json`, the same English string copied verbatim
  into `sk.json`. Translation is a deliberate later pass; the keys awaiting it are those
  whose `sk` value equals its `en` value. Leave existing Slovak text alone.

## Comments

Avoid them. Prefer naming, decomposition and types. Keep only what tooling requires or
what explains a genuinely non-obvious constraint.

## This Next.js

- Middleware is `src/proxy.ts`. `params` and `searchParams` are promises.
- Locale comes from the `NEXT_LOCALE` cookie; there is no locale route segment.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
