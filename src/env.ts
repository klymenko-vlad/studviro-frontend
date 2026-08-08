import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * Single source of truth for environment variables.
 *
 * The backend refuses to boot on a bad env (see `backend/src/config/env.schema.ts`);
 * this does the same for the frontend, at build time rather than at 3am in production.
 *
 * `NEXT_PUBLIC_*` values are inlined into the client bundle — never put a secret there.
 */
export const env = createEnv({
  /** Server-only. Reading any of these from a Client Component throws. */
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    /**
     * Base URL the *server* uses to reach the API. In Docker this is the service
     * name (`http://backend:3000`), which the browser could never resolve — hence
     * a separate variable from the public one.
     */
    API_INTERNAL_URL: z.url().optional(),
    ANALYZE: z
      .enum(['true', 'false'])
      .default('false')
      .transform(value => value === 'true'),
  },

  /** Shipped to the browser. Public by definition. */
  client: {
    NEXT_PUBLIC_API_URL: z.url(),
    NEXT_PUBLIC_APP_URL: z.url().default('http://localhost:3001'),
    NEXT_PUBLIC_ENV: z
      .enum(['local', 'development', 'staging', 'production'])
      .default('local'),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  },

  /**
   * Next.js inlines `process.env.NEXT_PUBLIC_*` by literal text match, so the
   * client keys have to be spelled out here rather than spread from an object.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    API_INTERNAL_URL: process.env['API_INTERNAL_URL'],
    ANALYZE: process.env['ANALYZE'],
    NEXT_PUBLIC_API_URL: process.env['NEXT_PUBLIC_API_URL'],
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
    NEXT_PUBLIC_ENV: process.env['NEXT_PUBLIC_ENV'],
    NEXT_PUBLIC_SENTRY_DSN: process.env['NEXT_PUBLIC_SENTRY_DSN'],
  },

  /** Lets `docker build` and `next lint` run without a populated env. */
  skipValidation: process.env['SKIP_ENV_VALIDATION'] === 'true',
  emptyStringAsUndefined: true,
});
