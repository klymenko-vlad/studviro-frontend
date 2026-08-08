# 0004. Vendor-neutral logging seams before choosing an APM

- **Status**: accepted
- **Date**: 2026-08-08

## Context

The platform plan calls for Sentry. Committing to a vendor SDK now would mean
picking one before there is production traffic to justify the choice, and
scattering vendor calls across the codebase makes changing that decision
expensive.

At the same time, the seams an APM needs — a request-error hook, a logging
choke point, web-vitals collection — are exactly the things that are painful to
retrofit, because they touch every call site.

## Decision

Build the seams, defer the vendor.

- `src/shared/lib/logger/logger.ts` — a logger with a `LogSink` registry.
  `addLogSink` returns a disposer. The console sink is the only one wired by
  default.
- `no-console` is an ESLint error application-wide. The single sanctioned
  `eslint-disable` lives inside the console sink, which is what makes adding a
  second destination a one-file change.
- `src/instrumentation.ts` — `register()` for process-level setup and
  `onRequestError` for every uncaught server render / Route Handler error. It
  logs the backend's `x-request-id` so a frontend stack trace can be joined to
  the backend's pino logs for the same request.
- `src/app/_providers/web-vitals.tsx` — reports Core Web Vitals from real
  sessions via `useReportWebVitals`, warning past the Google "poor" thresholds.

`NEXT_PUBLIC_SENTRY_DSN` already exists in `src/env.ts` as optional, so adopting
Sentry is: install the SDK, initialise it in `register()`, register a sink.

## Consequences

- Until a sink is added, server logs go to stdout only. Acceptable pre-launch;
  it is the thing to fix first when real users arrive.
- The logger is a small amount of code we own rather than a vendor's. That is
  the price of not being locked in, and it is deliberately kept minimal — it
  fans out records and swallows sink failures, nothing more.
- Web-vitals data currently lands in the console sink, which means it is
  effectively unobserved in production until a real sink exists. The
  instrumentation is in place so that stops being true the day a vendor lands.
- A sink that throws is caught and ignored. A logging call must never be the
  reason a request fails.
