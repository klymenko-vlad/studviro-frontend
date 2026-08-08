import { env } from '@/env';

/**
 * Whether the app is served over https.
 *
 * Everything that hardens a response for https — the `Secure` flag on a cookie,
 * `upgrade-insecure-requests` in the CSP — keys off this rather than
 * `NODE_ENV`. A production *build* is not the same thing as a production
 * *origin*: CI's e2e run and a bare `next start` both set `NODE_ENV=production`
 * and serve plain http, where `Secure` cookies are discarded and every
 * subresource is rewritten to an https URL nothing answers. Chromium exempts
 * localhost from both rules and WebKit does not, so guessing from `NODE_ENV`
 * fails on exactly one browser and reads as flake.
 */
export const IS_SECURE_ORIGIN = env.NEXT_PUBLIC_APP_URL.startsWith('https:');

/**
 * Route table. Every navigation target is named here so a URL change is one edit
 * rather than a grep across the codebase.
 */
export const ROUTES = {
  home: '/',
  signIn: '/sign-in',
  signUp: '/sign-up',
  dashboard: '/dashboard',
} as const;

/** Default freshness window for queries that have no stronger opinion. */
export const QUERY_STALE_TIME = 60_000;

/**
 * localStorage key the theme preference persists under.
 *
 * It lives in this dependency-free module rather than next to the Zustand store
 * because three very different consumers need it: the store, the blocking inline
 * script in `shared/config/csp.ts`, and the proxy that hashes that script. Were
 * it exported from the store, importing it would drag Zustand into the Edge
 * middleware bundle.
 */
export const THEME_STORAGE_KEY = 'studviro-theme';
