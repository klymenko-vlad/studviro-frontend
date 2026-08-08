'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { env } from '@/env';

import { getAccessToken } from '@/shared/auth';
import {
  IS_SECURE_ORIGIN,
  isAppLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  type AppLocale,
} from '@/shared/config';

/**
 * Switches the interface language.
 *
 * The cookie is always written, so the choice takes effect for a signed-out
 * visitor too. For a signed-in user it is also persisted on the account, which
 * is what makes the preference follow them to another device — the cookie is a
 * per-browser cache of that value, not the record of it.
 *
 * Deliberately not a `Promise<void>` that swallows failures: the API call is
 * allowed to fail (offline, expired session) without costing the user the
 * language switch they just asked for, because the cookie has already landed.
 */
export async function switchLocale(locale: AppLocale): Promise<void> {
  // A Server Action argument is attacker-controlled like any other request
  // body — never trust it into a cookie unchecked.
  if (!isAppLocale(locale)) return;

  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: 'lax',
    httpOnly: false,
    secure: IS_SECURE_ORIGIN,
  });

  await persistToAccount(locale);

  // The whole tree renders translated strings, so nothing below the layout can
  // stay cached across a language change.
  revalidatePath('/', 'layout');
}

async function persistToAccount(locale: AppLocale): Promise<void> {
  const accessToken = await getAccessToken();
  if (!accessToken) return;

  const origin = env.API_INTERNAL_URL ?? env.NEXT_PUBLIC_API_URL;

  await fetch(`${origin}/api/v1/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ locale }),
    cache: 'no-store',
  }).catch(() => undefined);
}
