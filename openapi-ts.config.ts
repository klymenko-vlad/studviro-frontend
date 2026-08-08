import { defineConfig } from '@hey-api/openapi-ts';

/**
 * Generates the entire API layer from the backend's OpenAPI document: types,
 * a typed SDK, TanStack Query options/keys, and Zod schemas.
 *
 * Run through `scripts/generate-api.mts` (`pnpm api:generate`), which resolves
 * `OPENAPI_SOURCE` first — by default the sibling backend checkout's committed
 * `openapi.json`, so codegen needs neither a running server nor a database.
 *
 * Never edit anything under the output path; it is overwritten wholesale and
 * `pnpm api:check` fails the build if it differs from the spec.
 */
export default defineConfig({
  input: process.env['OPENAPI_SOURCE'] ?? '../backend/openapi.json',
  output: {
    path: 'src/shared/api/generated',
    // The generated tree is deleted and rewritten on every run, so a renamed
    // endpoint cannot leave a stale file behind that still compiles.
    clean: true,
    postProcess: ['prettier'],
  },
  plugins: [
    {
      name: '@hey-api/client-next',
      // Auth headers, base URL and error normalisation live in our own module;
      // the generated client imports it instead of us patching generated output.
      runtimeConfigPath: './src/shared/api/client-config.ts',
    },
    {
      name: '@hey-api/typescript',
      enums: 'javascript',
    },
    {
      name: '@hey-api/sdk',
      operations: { strategy: 'byTags' },
      // Responses are parsed through the generated Zod schemas, so a backend that
      // silently changes a field shape fails loudly at the boundary instead of
      // producing `undefined` three components deep.
      validator: true,
    },
    {
      name: 'zod',
      // Request schemas double as the source for react-hook-form resolvers.
      requests: true,
      responses: true,
    },
    {
      name: '@tanstack/react-query',
      queryOptions: true,
      mutationOptions: true,
      infiniteQueryOptions: true,
    },
  ],
});
