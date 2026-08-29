import 'server-only';

import { NextResponse } from 'next/server';
import { env } from '@/env';

import type { AuthTokensDto, ErrorResponseDto } from '@/shared/api';
import {
  ACCESS_TOKEN_COOKIE,
  IS_SECURE_ORIGIN,
  isAppLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  REFRESH_COOKIE_MAX_AGE,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_COOKIE,
  sessionCookieOptions,
} from '@/shared/config';

/**
 * Helpers shared by the `/api/auth/*` Route Handlers — the only place in the
 * app allowed to see a raw token. They read it out of the API's JSON response
 * and put it straight into an httpOnly cookie; it is never returned to the
 * browser and never reaches client-side JavaScript.
 */

/**
 * The app's own origin, normalised once.
 *
 * `NEXT_PUBLIC_APP_URL` is validated as a URL, not as an origin, so a deployment
 * that sets `https://app.example.com/` is legal — and comparing that string to
 * an `Origin` header, which never carries a trailing slash or a path, would
 * reject every authenticated request in production while passing locally.
 */
const APP_ORIGIN = new URL(env.NEXT_PUBLIC_APP_URL).origin;

/**
 * Rejects a cross-site caller before the request is acted on.
 *
 * `SameSite=Lax` already withholds our cookies from a cross-site POST, so this
 * is defence in depth — but it is cheap, and it also covers the case of a
 * future cookie being added with looser flags by mistake.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');

  // A same-origin `fetch` always sends Origin; its absence means a non-browser
  // client, which is not what these routes exist for.
  if (!origin) return false;

  return origin === APP_ORIGIN;
}

export function forbidden(): NextResponse {
  return NextResponse.json({ message: 'Cross-origin request rejected' }, { status: 403 });
}

/**
 * Forwards the API's own status and error body. The frontend shows the message
 * the backend chose — duplicating that mapping here is how the two drift into
 * disagreeing about what "invalid credentials" says.
 */
export async function relayFailure(response: Response): Promise<NextResponse> {
  const body = (await response.json().catch(() => null)) as ErrorResponseDto | null;

  return NextResponse.json(body ?? { message: 'Request failed' }, {
    status: response.status,
  });
}

/**
 * Puts a fresh token pair into cookies and returns only the user.
 *
 * The locale cookie is rewritten from the account at the same time: the stored
 * preference is the source of truth, so signing in on a new device brings your
 * language with you rather than adopting that device's browser setting.
 */
export function respondWithSession(tokens: AuthTokensDto): NextResponse {
  const response = NextResponse.json({ user: tokens.user });

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

  // Guarded like every other write to this cookie: the account's locale comes
  // from the API, and a value we do not serve would leave `request.ts` falling
  // back to `Accept-Language` on every render until the user switches manually.
  if (isAppLocale(tokens.user.locale)) {
    response.cookies.set(LOCALE_COOKIE, tokens.user.locale, {
      path: '/',
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: 'lax',
      httpOnly: false,
      secure: IS_SECURE_ORIGIN,
    });
  }

  return response;
}

/**
 * Cleared with the same `path` they were written under — a mismatched path
 * leaves the original cookie in place and the user apparently signed in.
 */
export function clearSession(response: NextResponse): NextResponse {
  response.cookies.set(ACCESS_TOKEN_COOKIE, '', sessionCookieOptions('/', 0));
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    '',
    sessionCookieOptions(REFRESH_COOKIE_PATH, 0),
  );

  return response;
}

/**
 * `next` arrives from the query string and is handed to `router.push`, so it is
 * an open-redirect sink. Only a same-site absolute path is accepted: `//evil.com`
 * is protocol-relative and would navigate off-site despite starting with a slash.
 */
export function safeNext(next: string | string[] | undefined): string | undefined {
  if (typeof next !== 'string') return undefined;

  return next.startsWith('/') && !next.startsWith('//') ? next : undefined;
}
