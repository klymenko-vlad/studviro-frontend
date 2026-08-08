import { NextResponse, type NextRequest } from 'next/server';

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
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/shared/config/session';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/** Prefixes that require a session. Everything else is public. */
const PROTECTED_PREFIXES = [ROUTES.dashboard];

/**
 * Next.js 16 renamed Middleware to Proxy; the contract is unchanged.
 *
 * Keep this cheap. It runs on every matched request, and it is explicitly not a
 * place for session lookups or data fetching — do authorization in the layouts
 * and Route Handlers that actually own the data. The cookie checks below are
 * presence tests, not verification: they exist to avoid rendering a whole
 * authenticated shell for a visitor who is plainly signed out.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /**
   * Fresh per request, and passed to the render on a request header — the only
   * channel a Server Component can read it from. Next picks the same value out
   * of the policy and stamps it onto its own inline bootstrap scripts.
   */
  const nonce = createNonce();

  const response = requiresSession(pathname)
    ? guardSession(request, nonce)
    : forwardWithNonce(request, nonce);

  response.headers.set(
    'content-security-policy',
    buildContentSecurityPolicy({
      isProduction: IS_PRODUCTION,
      isSecureOrigin: IS_SECURE_ORIGIN,
      nonce,
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
 * A signed-out visitor is sent to sign-in; someone holding only a refresh token
 * is let through, because the page's own data fetch will refresh it server-side.
 *
 * The let-through case forwards the nonce like any other render — a protected
 * page runs the same inline theme script as a public one, and returning a bare
 * `next()` here would leave it with a policy it cannot satisfy.
 */
function guardSession(request: NextRequest, nonce: string): NextResponse {
  const hasSession =
    request.cookies.has(ACCESS_TOKEN_COOKIE) || request.cookies.has(REFRESH_TOKEN_COOKIE);

  if (hasSession) return forwardWithNonce(request, nonce);

  const signIn = new URL(ROUTES.signIn, request.url);
  // Preserved so the sign-in form can return the user where they were headed.
  signIn.searchParams.set('next', request.nextUrl.pathname);

  return NextResponse.redirect(signIn);
}

/**
 * Pins the negotiated locale on the first visit, so a visitor whose browser
 * sends `uk` keeps Ukrainian even if a later request arrives without the header
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
