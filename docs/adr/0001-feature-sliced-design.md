# 0001. Feature-Sliced Design with `views/` instead of `pages/`

- **Status**: accepted
- **Date**: 2026-08-08

## Context

The app needs a structure that survives more than a handful of features. The
reference project (`talendoo/Frontend-RecruitmentERP`) uses Feature-Sliced
Design and it has scaled there, so people moving between the two codebases
should find the same layering.

Canonical FSD names its page-composition layer `pages`. In a Next.js App Router
project, `src/pages` is the Pages Router directory — Next would pick it up as
routes.

## Decision

Adopt FSD with the layers `app → views → widgets → features → entities → shared`,
renaming the canonical `pages` layer to `views`.

Enforcement is split across two tools because neither covers the whole rule:

- **`eslint-plugin-boundaries`** checks import _direction_ between layers, so a
  violation appears in the editor as you type it.
- **Steiger** checks slice _structure_ — public APIs, segment naming, sidesteps —
  which the ESLint plugin has no concept of.

Steiger only recognises the canonical layer name, so `./src/views/**` is in its
ignore list and `fsd/typo-in-layer-name` is off. The `views` layer is policed by
`eslint-plugin-boundaries` alone.

## Consequences

- Two tools to keep in step; the layer list is duplicated in `eslint.config.mjs`
  and implicitly in `steiger.config.mjs`.
- `views/` gets weaker structural checking than the other layers — no public-API
  or segment-purpose enforcement, only import direction.
- Anyone arriving from a canonical FSD project has to learn the rename. This is
  the cost of the Next.js constraint and is not negotiable while we use the App
  Router.
- Slices are scaffolded with `pnpm gen:slice <layer>/<slice>` so the conventions
  are produced rather than remembered.
