import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/env';

import type { AuthTokensDto } from '@/shared/api';
import { isExpired } from '@/shared/auth/token-expiry';
import { rotateRefreshToken } from '@/shared/auth/token-rotation';
import { IS_SECURE_ORIGIN, ROUTES } from '@/shared/config/app';
import {
  buildContentSecurityPolicy,
  createNonce,
  NONCE_HEADER,
} from '@/shared/config/csp';
import {
  isAppLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  negotiateLocale,
} from '@/shared/config/i18n/routing';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_COOKIE_MAX_AGE,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_COOKIE,
  sessionCookieOptions,
} from '@/shared/config/session';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Prefixes that require a session. Everything else is public.
 *
 * Every signed-in screen has to be listed: a page left off renders its whole
 * shell to a signed-out visitor and only fails once its own data fetch does,
 * which reads as a broken page rather than as "you are not signed in".
 */
const PROTECTED_PREFIXES = [ROUTES.account, ROUTES.institutions];

/**
 * Next.js 16 renamed Middleware to Proxy; the contract is unchanged.
 *
 * Keep this cheap. It runs on every matched request, and it is not a place for
 * data fetching — do authorization in the layouts and Route Handlers that own the
 * data. The one call it makes is renewing a lapsed access token, and only here can
 * that be done safely: a render cannot write cookies, so a render that rotated the
 * refresh token would lose the new one and the next request would replay the
 * spent one (ADR 0036).
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  /**
   * Fresh per request, and passed to the render on a request header — the only
   * channel a Server Component can read it from. Next picks the same value out
   * of the policy and stamps it onto its own inline bootstrap scripts.
   */
  const nonce = createNonce();

  const renewal = await renewSession(request);

  const response =
    requiresSession(pathname) && !hasSession(request)
      ? redirectToSignIn(request)
      : forwardWithNonce(request, nonce);

  if (renewal === 'ended') endSession(response);
  else if (renewal) storeSession(response, renewal);

  response.headers.set(
    'content-security-policy',
    buildContentSecurityPolicy({
      isProduction: IS_PRODUCTION,
      isSecureOrigin: IS_SECURE_ORIGIN,
      nonce,
      storageOrigin: env.STORAGE_PUBLIC_URL,
    }),
  );

  ensureLocaleCookie(request, response);

  return response;
}

/**
 * `NextResponse.next` cannot mutate the *request* headers in place; passing a
 * modified `Headers` through `request` is the supported way to hand a value
 * down to the render.
 *
 * `set`, not `append`: a client is free to send an `x-nonce` header of its own,
 * and letting that reach the render would hand an attacker the one value the
 * policy trusts.
 */
function forwardWithNonce(request: NextRequest, nonce: string): NextResponse {
  const headers = new Headers(request.headers);
  headers.set(NONCE_HEADER, nonce);

  return NextResponse.next({ request: { headers } });
}

function requiresSession(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Renews the session when the access token has lapsed or is about to, and writes
 * the new pair into the request's own cookies so the render and the Route
 * Handlers behind it read the token that will actually be accepted.
 *
 * `'ended'` when the API refuses the refresh token: the session is over, and a
 * protected page sends the visitor to sign in. An API that cannot be reached is
 * not an ended session — the request goes on and its own data fetch reports it.
 */
async function renewSession(
  request: NextRequest,
): Promise<AuthTokensDto | 'ended' | undefined> {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (accessToken && !isExpired(accessToken)) return undefined;

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) return undefined;

  let tokens: AuthTokensDto | undefined;
  try {
    tokens = await rotateRefreshToken(refreshToken, request.headers.get('user-agent'));
  } catch {
    return undefined;
  }

  if (!tokens) {
    request.cookies.delete(ACCESS_TOKEN_COOKIE);
    request.cookies.delete(REFRESH_TOKEN_COOKIE);
    return 'ended';
  }

  request.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken);
  request.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken);

  return tokens;
}

function hasSession(request: NextRequest): boolean {
  return (
    request.cookies.has(ACCESS_TOKEN_COOKIE) || request.cookies.has(REFRESH_TOKEN_COOKIE)
  );
}

function redirectToSignIn(request: NextRequest): NextResponse {
  const signIn = new URL(ROUTES.signIn, request.url);
  // Preserved so the sign-in form can return the user where they were headed.
  signIn.searchParams.set('next', request.nextUrl.pathname);

  return NextResponse.redirect(signIn);
}

function storeSession(response: NextResponse, tokens: AuthTokensDto): void {
  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    tokens.accessToken,
    sessionCookieOptions('/', tokens.expiresIn),
  );
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    tokens.refreshToken,
    sessionCookieOptions(REFRESH_COOKIE_PATH, REFRESH_COOKIE_MAX_AGE),
  );
}

function endSession(response: NextResponse): void {
  response.cookies.set(ACCESS_TOKEN_COOKIE, '', sessionCookieOptions('/', 0));
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    '',
    sessionCookieOptions(REFRESH_COOKIE_PATH, 0),
  );
}

/**
 * Pins the negotiated locale on the first visit, so a visitor whose browser
 * sends `sk` keeps Slovak even if a later request arrives without the header
 * — and so the switcher has an existing value to overwrite rather than a gap.
 */
function ensureLocaleCookie(request: NextRequest, response: NextResponse): void {
  if (isAppLocale(request.cookies.get(LOCALE_COOKIE)?.value)) return;

  response.cookies.set(
    LOCALE_COOKIE,
    negotiateLocale(request.headers.get('accept-language')),
    {
      path: '/',
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: 'lax',
      // Readable by JS on purpose: it carries no authority, and analytics or a
      // client-side widget knowing the display language is useful.
      httpOnly: false,
      secure: IS_SECURE_ORIGIN,
    },
  );
}

export const config = {
  // Skip Next internals, the API routes, and anything with a file extension.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
