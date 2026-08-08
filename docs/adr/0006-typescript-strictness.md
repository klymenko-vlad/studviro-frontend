# 0006. Maximum TypeScript strictness, minus `exactOptionalPropertyTypes`

- **Status**: accepted
- **Date**: 2026-08-08

## Context

Strictness flags are cheap to turn on before there is code and expensive after.
The decision had to be made at the start of the project or effectively never.

## Decision

Enable `strict` plus `noUncheckedIndexedAccess`, `noImplicitOverride`,
`noImplicitReturns`, `noFallthroughCasesInSwitch`,
`noPropertyAccessFromIndexSignature`, `useUnknownInCatchVariables`,
`forceConsistentCasingInFileNames`, and `verbatimModuleSyntax`.

Leave `exactOptionalPropertyTypes` **off**.

The generated API client and Playwright's own config types both model optional
fields as `T | undefined` rather than as genuinely absent properties. Neither is
ours to change, and enabling the flag would mean either editing generated output
on every regeneration or littering the codebase with casts at the boundary.

Type-aware ESLint runs on top via `typescript-eslint`'s `strictTypeChecked` and
`stylisticTypeChecked` presets, with `projectService: true` so no parser project
list has to be maintained by hand.

## Consequences

- `noUncheckedIndexedAccess` makes every array index and record lookup nullable.
  This is the flag people most want to disable; it is also the one that catches
  the most real bugs. `@typescript-eslint/no-unnecessary-condition` is configured
  with `allowConstantLoopConditions` because of it.
- `noPropertyAccessFromIndexSignature` forces `process.env['FOO']` bracket
  syntax, which is why `src/env.ts` and the config files read that way.
- `verbatimModuleSyntax` requires explicit `import type`. Enforced and
  auto-fixed by `@typescript-eslint/consistent-type-imports`.
- Optional properties can still be explicitly set to `undefined`, which is a
  real, accepted looseness. Code that cares about the distinction must check it
  at runtime rather than relying on the type.
