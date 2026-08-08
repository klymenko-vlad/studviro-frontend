import { afterEach, describe, expect, it } from 'vitest';

import { allFlags, isEnabled, overrideFlag, resetFlagOverrides } from './flags';

afterEach(resetFlagOverrides);

describe('isEnabled', () => {
  /** The test env runs as `local`, where the reference flag is on. */
  it('reads the registry for the current environment', () => {
    expect(isEnabled('devtools')).toBe(true);
  });
});

describe('overrideFlag', () => {
  it('wins over the registry value', () => {
    overrideFlag('devtools', false);

    expect(isEnabled('devtools')).toBe(false);
  });

  it('restores the registry value when released', () => {
    const release = overrideFlag('devtools', false);

    release();

    expect(isEnabled('devtools')).toBe(true);
  });

  // `false` is a legitimate override, so the lookup must distinguish "set to
  // false" from "not set" rather than testing falsiness.
  it('treats an explicit false as set, not as absent', () => {
    overrideFlag('devtools', false);

    expect(allFlags().devtools).toBe(false);
  });
});

describe('allFlags', () => {
  it('reports every registered flag', () => {
    expect(Object.keys(allFlags())).toContain('devtools');
  });
});
