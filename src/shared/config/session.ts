import { IS_SECURE_ORIGIN } from './app';

/**
 * Cookie names and flags for the BFF session.
 *
 * Tokens are issued by the API in a JSON body and re-housed here as httpOnly
 * cookies on *this* origin. Nothing in the browser can read them, and because
 * they are first-party there is no `SameSite=None` and no cross-site credential
 * surface.
 *
 * Dependency-free on purpose: `src/proxy.ts` imports this, and anything it
 * reaches is bundled into the Edge runtime.
 */
export const ACCESS_TOKEN_COOKIE = 'sv_at';
export const REFRESH_TOKEN_COOKIE = 'sv_refresh';

/** The half-finished sign-in between a correct password and a second factor. */
export const TWO_FACTOR_CHALLENGE_COOKIE = 'sv_2fa';
export const TWO_FACTOR_CHALLENGE_PATH = '/api/auth/login';
export const TWO_FACTOR_CHALLENGE_MAX_AGE = 60 * 5;

/**
 * Sent on every request, because every request is somewhere a lapsed access token
 * has to be renewed: `src/proxy.ts` renews it before a page renders, and the API
 * proxy before it forwards a call. Scoped to `/api/auth` it reached neither, and
 * every session ended when its fifteen-minute access token did (ADR 0036).
 */
export const REFRESH_COOKIE_PATH = '/';

/**
 * Where the refresh token used to live, under the name it used to have. Cleared on
 * sign-out so a browser that signed in before ADR 0036 is not left holding one.
 * A different name, not just a different path: a response can carry only one
 * cookie per name, and it has to set the new one and clear the old one at once.
 */
export const LEGACY_REFRESH_TOKEN_COOKIE = 'sv_rt';
export const LEGACY_REFRESH_COOKIE_PATH = '/api/auth';

/**
 * A refresh token outlives its cookie only if the server says so; keeping this
 * a little under the backend's `JWT_REFRESH_TTL` means the browser stops sending
 * a token the API would reject anyway.
 */
export const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export interface SessionCookieOptions {
  readonly httpOnly: true;
  readonly sameSite: 'lax';
  readonly secure: boolean;
  readonly path: string;
  readonly maxAge?: number;
}

export function sessionCookieOptions(
  path: string,
  maxAge?: number,
): SessionCookieOptions {
  return {
    httpOnly: true,
    /**
     * `lax`, not `strict`: `strict` withholds the cookie on the first request
     * after following an external link, so a user arriving from email would
     * land signed out and sign in again for no reason. `lax` still blocks the
     * cross-site POST that CSRF depends on.
     */
    sameSite: 'lax',
    secure: IS_SECURE_ORIGIN,
    path,
    ...(maxAge === undefined ? {} : { maxAge }),
  };
}
