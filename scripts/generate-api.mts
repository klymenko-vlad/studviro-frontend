/**
 * Resolves the OpenAPI document, then runs `@hey-api/openapi-ts` over it.
 *
 * Source resolution, in order:
 *   1. `OPENAPI_SOURCE` — a path or URL, set explicitly.
 *   2. `../backend/openapi.json` — the sibling checkout's committed spec.
 *   3. `${NEXT_PUBLIC_API_URL}/api/docs/json` — a running or deployed backend.
 *
 * (2) is the default on purpose: the spec is generated from the backend's
 * controllers and committed, so codegen never needs a server, a database, or a
 * deployed environment.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@hey-api/openapi-ts';

import config from '../openapi-ts.config';

const LOCAL_SPEC = resolve(process.cwd(), '../backend/openapi.json');

function resolveSource(): string {
  const explicit = process.env['OPENAPI_SOURCE'];
  if (explicit) {
    if (explicit.startsWith('http')) return explicit;
    const path = resolve(process.cwd(), explicit);
    if (!existsSync(path)) {
      throw new Error(
        `OPENAPI_SOURCE points at ${path}, which does not exist. ` +
          `Run \`pnpm openapi:generate\` in the backend, or set OPENAPI_SOURCE to a URL.`,
      );
    }
    return path;
  }

  if (existsSync(LOCAL_SPEC)) return LOCAL_SPEC;

  const apiUrl = process.env['NEXT_PUBLIC_API_URL'];
  if (!apiUrl) {
    throw new Error(
      'No OpenAPI source. Either check out the backend alongside this repo and run ' +
        '`pnpm openapi:generate` there, or set OPENAPI_SOURCE / NEXT_PUBLIC_API_URL.',
    );
  }
  // NEXT_PUBLIC_API_URL is the origin; the generated paths carry the /api/v1 prefix.
  return `${apiUrl.replace(/\/$/, '')}/api/docs/json`;
}

const source = resolveSource();
console.log(`Generating API client from ${source}`);

/**
 * The config is imported and passed explicitly rather than left to be
 * discovered: `createClient()` with no argument resolves nothing under
 * openapi-ts v0.99 and exits successfully, which looks exactly like a
 * regeneration that produced no changes.
 */
await createClient({ ...(await config), input: source });

console.log('API client written to src/shared/api/generated');
