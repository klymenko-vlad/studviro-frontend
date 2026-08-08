# 0005. jsdom for component tests, Playwright for anything a browser must judge

- **Status**: accepted
- **Date**: 2026-08-08

## Context

`docs/platform-plan.md` recommended Vitest browser mode with the Playwright
provider for component tests, on the grounds that jsdom "lies" — it has no
layout engine, no real CSS cascade, and approximates a number of DOM APIs.

The counterweight is speed and operational cost. The current unit suite runs in
about two seconds. Browser mode boots a real browser per worker, needs the
Playwright browsers installed in every CI job that runs tests, and turns a
sub-second watch loop into a multi-second one.

## Decision

Keep jsdom (`vitest.config.mts`) for unit and component tests. Send anything
that genuinely depends on a browser to the Playwright suite in `e2e/`.

The dividing line: if the assertion is about _behaviour_ — roles, labels, state
transitions, what a user can do — it belongs in jsdom. If it is about _rendering_
— computed styles, layout, paint timing, CSP enforcement, theme-before-paint —
it belongs in Playwright, which is why the CSP and theme-flash tests live in
`e2e/security.spec.ts` rather than in a component test.

## Consequences

- Component tests cannot assert on computed styles or layout. Attempting to is a
  signal the test is in the wrong suite, not that jsdom needs replacing.
- The fast feedback loop stays fast, which is the main reason people actually
  run tests before pushing.
- Coverage thresholds apply to the jsdom suite only; e2e coverage is not measured.
- Revisit if we accumulate a meaningful number of tests that are awkward or
  impossible in jsdom. The migration path is a config change plus installing
  browsers in the test job — it does not require rewriting the tests, since both
  modes use Testing Library.
