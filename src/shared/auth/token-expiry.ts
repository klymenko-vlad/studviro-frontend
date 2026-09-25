/** Renew this many seconds before the token actually lapses. */
const EXPIRY_SKEW_SECONDS = 30;

/**
 * `exp` read without verifying the signature — deliberately. This decides only
 * *when to bother refreshing*; the API verifies the token on every call, so a
 * forged one buys nothing but a wasted round trip.
 *
 * Free of `server-only` and of `next/headers` so `src/proxy.ts` can use it.
 */
export function isExpired(token: string, now = Date.now()): boolean {
  const payload = token.split('.')[1];
  if (!payload) return true;

  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      exp?: number;
    };

    if (typeof exp !== 'number') return true;

    return exp - EXPIRY_SKEW_SECONDS <= Math.floor(now / 1000);
  } catch {
    return true;
  }
}
