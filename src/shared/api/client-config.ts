import { env } from '@/env';

import type { CreateClientConfig } from './generated/client.gen';

/**
 * Runtime configuration for the generated client. `openapi-ts.config.ts` points
 * the generator at this file, so the generated code imports our settings rather
 * than us hand-patching generated output after every run.
 *
 * This module runs on both the server and the client — keep it free of anything
 * that only exists in one of them.
 */
export const createClientConfig: CreateClientConfig = (config = {}) => ({
  ...config,

  /**
   * Two different destinations, for one reason: the browser must never hold an
   * access token.
   *
   * - In the browser, calls go to `/api/proxy` on this origin, where a Route
   *   Handler attaches the bearer token server-side.
   * - On the server, the API is called directly — possibly under a hostname the
   *   browser could never resolve (a Docker service name, a VPC endpoint),
   *   which is why `API_INTERNAL_URL` exists separately.
   *
   * `typeof window` is the only reliable split point, because this module is
   * bundled for both runtimes.
   */
  baseUrl:
    typeof window === 'undefined'
      ? (env.API_INTERNAL_URL ?? env.NEXT_PUBLIC_API_URL)
      : '/api/proxy',

  /**
   * Same-origin: the session cookies must reach the proxy Route Handler so it
   * can resolve the token. They are never sent to the API itself, which the
   * proxy strips.
   */
  credentials: 'same-origin',

  // Not spread into `config.headers`: that field also accepts a `Headers`
  // instance or an entry array, and spreading either yields numeric keys.
  headers: config.headers ?? { 'Content-Type': 'application/json' },

  /**
   * Opt out of Next's caching by default. Most of this API is per-user data, and
   * a wrongly cached authenticated response is a data-leak bug, not a perf bug.
   * Individual calls opt back in with `next: { revalidate, tags }`.
   */
  next: { revalidate: 0 },
});
