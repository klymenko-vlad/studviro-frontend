import 'server-only';

import { env } from '@/env';

/**
 * Where the server reaches the API.
 *
 * `API_INTERNAL_URL` exists because the API may live behind a hostname only the
 * server can resolve — a Docker service name, a private VPC endpoint — which the
 * browser could never reach.
 */
export function apiOrigin(): string {
  return env.API_INTERNAL_URL ?? env.NEXT_PUBLIC_API_URL;
}
