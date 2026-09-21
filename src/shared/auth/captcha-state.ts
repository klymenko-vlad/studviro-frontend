import 'server-only';

import { apiOrigin } from './api-origin';

/**
 * Whether this deployment asks the public forms for a captcha. Read on the
 * server and handed to the form as a prop.
 *
 * Lives here rather than in `entities/captcha` because that slice's public API
 * re-exports two `'use client'` modules — a Server Component importing the
 * server read through it drags both into the client graph, which measured
 * **+19 kB gzipped**.
 *
 * Deliberately not a `useQuery`: whether a deployment asks for a captcha is
 * fixed at deploy, and the three auth routes had no client query at all before
 * this — adding one pulled React Query's observer machinery into their chunks
 * and cost **13.6 kB gzipped** against 8 kB of headroom. It also meant every
 * form flashed without its verification line and then grew one.
 */
export async function captchaEnabled(): Promise<boolean> {
  try {
    const response = await fetch(`${apiOrigin()}/api/v1/captcha`, { cache: 'no-store' });
    if (!response.ok) return false;

    const { enabled } = (await response.json()) as { enabled: boolean };

    return enabled;
  } catch {
    // An unreachable API is about to break the form anyway; rendering a
    // verification line nobody can complete would only add a second failure.
    return false;
  }
}
