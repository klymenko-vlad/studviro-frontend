# Architecture decision records

Short, immutable notes about decisions that are expensive to reverse and
non-obvious from the code.

## When to write one

Write an ADR when the answer to "why is it like this?" is a _judgement_, not a
fact you can read off the source. A record is worth it if a competent newcomer
would otherwise be tempted to "fix" the thing.

Do **not** write one for: naming, formatting, anything the linter enforces, or a
decision with only one reasonable option.

## Format

`NNNN-kebab-case-title.md`, numbered sequentially. Keep it to one page:

```markdown
# NNNN. Title

- **Status**: accepted | superseded by [NNNN](./NNNN-….md)
- **Date**: YYYY-MM-DD

## Context

What forced a decision. Constraints, not narrative.

## Decision

What we chose, in the active voice.

## Consequences

What this costs, and what it rules out. The honest part — an ADR with no
downsides listed is an advert, not a record.
```

Records are append-only. A decision that changes gets a _new_ record that
supersedes the old one; the old file stays, with its status updated.

## Index

| #                                         | Title                                                             | Status                                          |
| ----------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------- |
| [0001](./0001-feature-sliced-design.md)   | Feature-Sliced Design with `views/` instead of `pages/`           | accepted                                        |
| [0002](./0002-generated-api-client.md)    | Generate the API client from the backend's OpenAPI spec           | accepted                                        |
| [0003](./0003-hash-based-csp.md)          | Hash-based CSP rather than a per-request nonce                    | superseded by [0009](./0009-nonce-based-csp.md) |
| [0004](./0004-observability-seams.md)     | Vendor-neutral logging seams before choosing an APM               | accepted                                        |
| [0005](./0005-jsdom-over-browser-mode.md) | jsdom for component tests, Playwright for the rest                | accepted                                        |
| [0006](./0006-typescript-strictness.md)   | Maximum TypeScript strictness, minus `exactOptionalPropertyTypes` | accepted                                        |
| [0007](./0007-locale-in-cookie.md)        | Locale in a cookie, not in the URL                                | accepted                                        |
| [0008](./0008-bff-token-cookies.md)       | The Next server holds the tokens, not the browser                 | accepted                                        |
| [0009](./0009-nonce-based-csp.md)         | Nonce-based CSP, superseding the hash                             | accepted                                        |
