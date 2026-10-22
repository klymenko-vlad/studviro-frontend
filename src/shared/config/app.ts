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
  forStudents: '/for-students',
  forTeachers: '/for-teachers',
  forInstitutions: '/for-institutions',
  contact: '/contact',
  signIn: '/sign-in',
  signUp: '/sign-up',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  account: '/account',
  accountSettings: '/account/settings',
  institutions: '/institutions',
  createInstitution: '/institutions/new',
} as const;

/** Where a visitor lands once they hold a session. */
export const LANDING_ROUTE = ROUTES.account;

export const institutionRoutes = (institutionId: string) => {
  const base = `${ROUTES.institutions}/${institutionId}`;

  return {
    dashboard: base,
    courses: `${base}/courses`,
    courseOffering: (offeringId: string) => `${base}/courses/${offeringId}`,
    enroll: `${base}/courses?tab=find`,
    catalogue: `${base}/catalogue`,
    program: (programId: string) => `${base}/programs/${programId}`,
    teaching: `${base}/teaching`,
    grades: `${base}/grades`,
    calendar: `${base}/calendar`,
    exams: `${base}/exams`,
    notifications: `${base}/notifications`,
    learning: `${base}/learning`,
    roles: `${base}/roles`,
    orgUnits: `${base}/org-units`,
    people: `${base}/people`,
    search: `${base}/search`,
    audit: `${base}/audit`,
    bulk: `${base}/bulk`,
    settings: `${base}/settings`,
  } as const;
};

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
