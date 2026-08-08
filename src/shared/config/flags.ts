import { env } from '@/env';

/**
 * Every feature flag in the application, with the environments it is on in.
 *
 * One central registry rather than scattered `process.env` reads, because the
 * two questions you always end up asking — "what flags exist?" and "what is on
 * in staging?" — should both be answerable by reading one file.
 *
 * Adding a flag here makes it available to `isEnabled` and nowhere else; the key
 * union is derived, so a typo is a type error rather than a silent `false`.
 */
const FLAG_REGISTRY = {
  /**
   * Reference entry — replace when the first real flag lands. Kept because an
   * empty registry makes `FeatureFlag` the `never` type, and every call site
   * then fails to compile in a confusing way.
   */
  devtools: ['local', 'development'],
} as const satisfies Record<string, readonly AppEnv[]>;

type AppEnv = typeof env.NEXT_PUBLIC_ENV;

export type FeatureFlag = keyof typeof FLAG_REGISTRY;

/** Runtime overrides, applied ahead of the registry. */
const overrides = new Map<FeatureFlag, boolean>();

/**
 * Whether a flag is on for the current environment.
 *
 * Safe in both Server and Client Components: it reads only the public env, which
 * is inlined at build time in both.
 */
export function isEnabled(flag: FeatureFlag): boolean {
  const override = overrides.get(flag);
  if (override !== undefined) return override;

  return (FLAG_REGISTRY[flag] as readonly AppEnv[]).includes(env.NEXT_PUBLIC_ENV);
}

/**
 * Forces a flag on or off, returning a function that restores the registry value.
 *
 * Intended for tests and for a future admin/QA toggle. It is deliberately not
 * persisted — a flag that survives a reload is a configuration change, and that
 * belongs in the registry or in the vendor that eventually replaces it.
 */
export function overrideFlag(flag: FeatureFlag, value: boolean): () => void {
  overrides.set(flag, value);
  return () => overrides.delete(flag);
}

/** Drops every override. Call from a global test teardown. */
export function resetFlagOverrides(): void {
  overrides.clear();
}

/**
 * Snapshot of the whole registry, for debugging surfaces and for handing to a
 * vendor SDK as default values during a migration.
 */
export function allFlags(): Record<FeatureFlag, boolean> {
  const entries = Object.keys(FLAG_REGISTRY).map(flag => [
    flag,
    isEnabled(flag as FeatureFlag),
  ]);

  return Object.fromEntries(entries) as Record<FeatureFlag, boolean>;
}
