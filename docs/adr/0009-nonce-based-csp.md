# 0009. Nonce-based CSP, superseding the hash

- **Status**: accepted
- **Date**: 2026-08-08
- **Supersedes**: [0003](./0003-hash-based-csp.md)

## Context

[ADR 0003](./0003-hash-based-csp.md) allowed the one inline script — the blocking
theme initialiser — by SHA-256 hash, and rejected a nonce because generating one
per request forces dynamic rendering, which would have undone the per-locale
static prerendering the app relied on.

Two things have since changed.

**The reasoning had a hole.** The theme initialiser is not the only inline script
on the page. The App Router streams its RSC payload through inline
`self.__next_f.push(...)` scripts whose contents differ per render, so no
committed hash can cover them. Worse, CSP says that once _any_ hash or nonce
appears in `script-src`, `'unsafe-inline'` must be ignored — so the development
policy's `'unsafe-inline'` was inert. The result: the browser blocked Next's own
bootstrap, the page never hydrated, and every interactive control silently did
nothing. It was invisible because the affected e2e tests were failing for what
looked like unrelated reasons, and because a server-rendered page looks correct
until you click something.

**The cost is gone.** [ADR 0007](./0007-locale-in-cookie.md) moved the locale
into a cookie, so every page is dynamic already. A per-request nonce now costs
nothing that has not already been spent.

## Decision

Generate a nonce per request in `src/proxy.ts` and allow inline script by nonce.

- `createNonce()` in `shared/config/csp.ts` — 128 bits from `crypto.getRandomValues`.
- The proxy passes it to the render on an `x-nonce` request header (via
  `NextResponse.next({ request: { headers } })`), and puts it in the policy.
- The root layout reads it from `headers()` and sets `nonce` on the theme script.
  Next finds the nonce in the CSP header and stamps it onto its own script tags.
- `THEME_INIT_SCRIPT_HASH` is deleted, along with the unit test that recomputed
  it — there is no longer a constant to drift.

## Consequences

- `script-src` contains no hash at all. `csp.test.ts` asserts that explicitly,
  because reintroducing one would re-break hydration in exactly the way that hid
  for so long.
- The policy is built per request rather than once at module load. It is string
  concatenation on an already-dynamic route; the cost is not measurable.
- `'unsafe-inline'` is gone from the development policy too. It was never doing
  anything, and leaving it in implied a fallback that does not exist.
- The e2e suite now asserts two things a unit test cannot: that no CSP violation
  reaches the console, and that the nonce differs between responses. The first is
  the check that would have caught the original bug — the browser, not our code,
  is what decides whether a script runs.
- Adding a new inline script now means passing it the nonce, which is less
  friction than a new hash. That is a mild loss: hashes made inline script
  annoying enough to avoid. Prefer an external module regardless.
