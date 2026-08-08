import { IS_SECURE_ORIGIN } from './app';

/**
 * Cookie names and flags for the BFF session.
 *
 * Tokens are issued by the API in a JSON body and re-housed here as httpOnly
 * cookies on *this* origin. Nothing in the browser can read them, and because
 * they are first-party there is no `SameSite=None` and no cross-site credential
 * surface — see `docs/adr/0008-bff-token-cookies.md`.
 *
 * Dependency-free on purpose: `src/proxy.ts` imports this, and anything it
 * reaches is bundled into the Edge runtime.
 */
export const ACCESS_TOKEN_COOKIE = 'sv_at';
export const REFRESH_TOKEN_COOKIE = 'sv_rt';

/**
 * The refresh cookie is scoped to the only routes that redeem it. An XSS that
 * can force requests still cannot make the browser attach the refresh token to
 * an ordinary page load or API proxy call, which limits it to the access
 * token's lifetime rather than the refresh token's.
 */
export const REFRESH_COOKIE_PATH = '/api/auth';

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
