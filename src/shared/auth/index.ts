/**
 * Server-side session resolution and the helpers behind `/api/auth/*`.
 *
 * A segment of its own rather than part of `shared/api` for one reason: every
 * module here is `server-only`, and re-exporting them from the barrel that
 * client components import for `toApiError` would drag the server bundle — and
 * the tokens it handles — toward the browser.
 *
 * Named `auth` rather than `session` to stay distinguishable from the
 * `entities/session` slice, which is its client-side counterpart.
 *
 * Cookie *names and flags* deliberately live in `shared/config/session.ts`
 * instead: `src/proxy.ts` needs them, and anything it imports is bundled into
 * the Edge runtime.
 */
export { apiOrigin } from './api-origin';
export { captchaEnabled } from './captcha-state';
export {
  clearSession,
  forbidden,
  isSameOrigin,
  relayFailure,
  respondWithSession,
  safeNext,
} from './auth-route';
export { getAccessToken, getCurrentUser, type SessionUser } from './session';
export { userAgentHeader } from './client-context';
export { isExpired } from './token-expiry';
export {
  holdTwoFactorChallenge,
  releaseTwoFactorChallenge,
} from './two-factor-challenge';
export { rotateRefreshToken } from './token-rotation';
