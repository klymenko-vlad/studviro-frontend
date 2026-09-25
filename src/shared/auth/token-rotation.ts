import { createHash } from 'node:crypto';

import type { AuthTokensDto } from '@/shared/api';

import { apiOrigin } from './api-origin';

/**
 * How long a finished rotation is remembered. Requests that left the browser with
 * the old cookie before the new one landed are handed the same successor instead
 * of presenting a spent token to the API.
 */
const SETTLED_FOR_MS = 30_000;

interface Rotation {
  readonly result: Promise<AuthTokensDto | undefined>;
  settledAt?: number;
}

const REGISTRY = Symbol.for('studviro.auth.rotations');

/**
 * One map for the whole process. `src/proxy.ts` and the Route Handlers are
 * bundled separately, so a module-level map would be two maps — and a page load
 * rotating in one while its data calls rotate in the other is exactly the race
 * this exists to prevent.
 */
function rotations(): Map<string, Rotation> {
  const scope = globalThis as { [REGISTRY]?: Map<string, Rotation> };
  scope[REGISTRY] ??= new Map();

  return scope[REGISTRY];
}

/** Keyed by a digest, so the map never holds a usable token. */
function keyOf(refreshToken: string): string {
  return createHash('sha256').update(refreshToken).digest('base64url');
}

function forget(now: number): void {
  for (const [key, rotation] of rotations()) {
    if (rotation.settledAt !== undefined && now - rotation.settledAt > SETTLED_FOR_MS) {
      rotations().delete(key);
    }
  }
}

async function exchange(refreshToken: string): Promise<AuthTokensDto | undefined> {
  const response = await fetch(`${apiOrigin()}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });

  if (!response.ok) return undefined;

  return (await response.json()) as AuthTokensDto;
}

/**
 * Exchanges a refresh token for a new pair, once per token per process.
 *
 * The API reads a spent refresh token coming back as a leak. A page load fans out
 * — the document, its data calls, a second tab — and every one of them carries the
 * same cookie, so each rotating on its own would present the token the first one
 * just spent. Here they share one exchange and its answer. `undefined` means the
 * API refused: the session is over.
 */
export function rotateRefreshToken(
  refreshToken: string,
  now = Date.now(),
): Promise<AuthTokensDto | undefined> {
  forget(now);

  const key = keyOf(refreshToken);
  const pending = rotations().get(key);
  if (pending) return pending.result;

  const rotation: { result: Promise<AuthTokensDto | undefined>; settledAt?: number } = {
    result: exchange(refreshToken).then(
      tokens => {
        rotation.settledAt = Date.now();
        return tokens;
      },
      (error: unknown) => {
        // The API was not reached, so nothing was spent: let the next request try.
        rotations().delete(key);
        throw error;
      },
    ),
  };
  rotations().set(key, rotation);

  return rotation.result;
}

/** For tests: the map outlives `vi.resetModules`, because it lives on `globalThis`. */
export function forgetRotations(): void {
  rotations().clear();
}
