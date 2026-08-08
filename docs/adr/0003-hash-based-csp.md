# 0003. Hash-based CSP rather than a per-request nonce

- **Status**: superseded by [0009](./0009-nonce-based-csp.md)
- **Date**: 2026-08-08

## Context

The app serves one inline script: the blocking theme initialiser in the locale
layout, which must run before first paint to avoid a flash of the wrong theme.
Any Content-Security-Policy worth having forbids inline script by default, so
that one script has to be allowed explicitly.

The two standard mechanisms are a per-request nonce and a content hash.

A nonce must be freshly generated per request and threaded into the render. In
the App Router that means reading it from request headers during render, which
opts the route out of static generation. This app calls `generateStaticParams`
to prerender every locale at build time — precisely the thing a nonce would
undo. Plumbing the nonce through `next-intl`'s middleware is also awkward: the
`as-needed` prefix scheme produces a rewrite for the default locale, and
attaching modified request headers to a rewrite response is not a supported
operation.

The script is static. Its bytes are known at build time.

## Decision

Allow the theme script by SHA-256 hash in `script-src`.

- The script body and its hash live together in `src/shared/config/csp.ts`.
- `csp.test.ts` recomputes the digest from the script and asserts it matches the
  committed constant, so editing one without the other fails the unit suite.
- An e2e test loads the page and asserts no CSP violation reaches the console —
  the browser, not our code, is the thing that ultimately validates the hash.
- The policy is built once at module load in `src/proxy.ts`, not per request.

CSP is set in the proxy rather than in `next.config.ts` because the static
`headers()` config does not apply to middleware-produced rewrites, which is what
the default locale is served through.

## Consequences

- Adding a second inline script means adding a second hash. This is friction by
  design: inline script should be rare and deliberate.
- `style-src` keeps `'unsafe-inline'`. Next's font optimisation and React's
  inline `style` props emit style attributes no hash can cover. Style injection
  is a materially lower-severity sink than script injection; this is a considered
  trade, not an oversight.
- `'unsafe-eval'` is granted in development only, for Turbopack's HMR runtime.
- If the app ever needs genuinely dynamic inline script, this decision has to be
  revisited — and the static-prerendering cost accepted at that point.
