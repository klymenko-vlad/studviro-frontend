# 0002. Generate the API client from the backend's OpenAPI spec

- **Status**: accepted
- **Date**: 2026-08-08

## Context

The frontend and backend live in separate repositories. Without a machine-checked
contract, a renamed field or a changed status code becomes a runtime failure in
production rather than a red build.

The reference project solves this with `openapi-typescript` plus roughly seven
bash scripts post-processing the output — query keys, server hooks, index
merging, generic checks. It works, but it is a lot of bespoke machinery.

## Decision

Use `@hey-api/openapi-ts`, configured in `openapi-ts.config.ts`, generating into
`src/shared/api/generated/`:

- types and a typed SDK
- TanStack Query v5 options and query keys (replaces the query-key scripts)
- Zod schemas per DTO, which forms derive their validation from

The backend generates `openapi.json` from its Nest controllers and commits it.
CI on both sides diffs a fresh generation against the committed output, so the
spec can never drift from the controllers, and a breaking backend change turns
into a red frontend PR.

Generated code is never edited and never imported directly. `src/shared/api/index.ts`
re-exports the public surface; ESLint blocks the deep path.

## Consequences

- A backend change requires regenerating and committing on the frontend. This is
  the intended friction — it makes the break visible at review time.
- The generated output shape differs from what the team knows from the reference
  project. One-time learning cost.
- The `api-contract` CI job depends on being able to check out the backend repo.
  It is `continue-on-error` and degrades to a warning when the spec is
  unavailable, so a private-repo token issue does not block every PR.
- Hand-written glue stays deliberately thin and lives in `src/shared/api/`:
  client configuration, error normalisation to `ApiError`, and the QueryClient
  defaults.
