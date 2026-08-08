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
