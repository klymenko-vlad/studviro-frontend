# API contract

The frontend never hand-writes an API type, a fetcher, a query key, or a request
validator. All of it is generated from one artefact: the backend's `openapi.json`.

```
backend controllers
      │  pnpm openapi:generate      (backend, no DB, no server)
      ▼
backend/openapi.json                ← committed, diffed in CI
      │  pnpm api:generate          (frontend)
      ▼
frontend/src/shared/api/generated/  ← committed, diffed in CI
      │  re-exported through
      ▼
src/shared/api/index.ts             ← what application code imports
```

## Why generate from code, not from a running server

`backend/src/openapi.ts` builds the Nest application in memory, reads the decorator
metadata, writes `openapi.json`, and exits. It never listens on a port or opens a
connection. That means CI — and a developer with no Docker running — can produce
the spec, and the frontend can regenerate its client with no backend running at all.

It runs against `dist/`, not through tsx: esbuild does not emit `design:paramtypes`,
and without that metadata Nest cannot resolve a single constructor injection.

## Commands

Backend:

```bash
pnpm openapi:generate   # rebuild openapi.json from the controllers
pnpm openapi:check      # regenerate and fail if it differs from the committed file
```

Frontend:

```bash
pnpm api:generate       # rebuild the client from the spec
pnpm api:check          # regenerate and fail if it differs from the committed output
```

`pnpm api:generate` resolves its input in this order:

1. `OPENAPI_SOURCE` (path or URL)
2. `../backend/openapi.json` — the sibling checkout, the normal case
3. `${NEXT_PUBLIC_API_URL}/api/docs/json` — a running or deployed backend

## What gets generated

| File                           | Contents                                                               |
| ------------------------------ | ---------------------------------------------------------------------- |
| `types.gen.ts`                 | Every DTO, request, response and error shape                           |
| `sdk.gen.ts`                   | Typed call per operation, with request/response validation             |
| `zod.gen.ts`                   | A Zod schema per DTO, carrying the backend's own constraints           |
| `@tanstack/react-query.gen.ts` | `queryOptions`, `mutationOptions`, query keys, infinite queries        |
| `client.gen.ts`                | The client instance, configured from `src/shared/api/client-config.ts` |

Two consequences worth naming:

- **Responses are validated at the boundary.** A backend that silently changes a
  field shape fails loudly where the request happens, not three components deep
  as `undefined`.
- **Form validation is inherited.** `features/create-user` extends
  `zCreateUserDtoWritable` rather than restating "password is at least 12
  characters". Change the rule on the server and the form follows on the next
  regeneration.

## Rules

1. **Never edit `src/shared/api/generated/`.** It is deleted and rewritten on every
   run. `pnpm api:check` fails the build if it has been touched.
2. **Never import from it directly.** ESLint blocks the deep path; go through
   `@/shared/api`, so a regeneration that renames a symbol breaks in one file.
3. **Both `openapi.json` and the generated client are committed.** That is what
   makes CI able to _diff_ them. A backend breaking change becomes a red frontend
   PR instead of a production incident.

## Backend contract rules

The generator is only as good as the annotations. These are not stylistic:

- **Every route declares its success response** — `@ApiOkResponse({ type: Dto })`.
  Without it the generated type is `unknown`, and every consumer casts.
- **Every route declares its failures** — use `@ApiErrorResponses()`. Consumers
  then narrow to `ErrorResponseDto` instead of `unknown` on the error branch.
- **Every DTO is a named class.** Anonymous inline schemas generate anonymous
  types that nothing can refer to.
- **Paginated responses use `@ApiPageResponse(Model)`**, which builds a _named_
  `ModelPage` schema. An `allOf` composition generates an intersection whose
  members are all optional — that is how `items` ends up possibly-undefined on
  the frontend even though the server always sends it.
- **Query DTOs state `type:` explicitly** — `@ApiPropertyOptional({ type: Number })`.
  Reflection cannot see through a property initialiser, and the field silently
  becomes `object`.
- The `@nestjs/swagger` CLI plugin is enabled in `nest-cli.json`, which covers
  property types and JSDoc descriptions. It does **not** cover return types
  reliably; declare those explicitly.

## When the contract changes

1. Change the controller/DTO on the backend.
2. `pnpm openapi:generate` there; commit `openapi.json` with the change.
3. `pnpm api:generate` on the frontend; commit the regenerated client.
4. Fix the type errors. They are the list of every place the change matters.
