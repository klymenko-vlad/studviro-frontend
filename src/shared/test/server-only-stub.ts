/**
 * Stands in for the `server-only` package under Vitest.
 *
 * The real module throws on import to stop server code being pulled into a
 * client bundle. That guard is enforced by the Next.js build — where a
 * `'use server'` module is replaced by a client reference and its body never
 * reaches the browser — but Vitest has no such transform, so a client component
 * test that renders a Server Action's caller imports the body for real and trips
 * the guard on code Next would never have shipped.
 *
 * Aliased in `vitest.config.mts`. Deliberately empty.
 */
export {};
