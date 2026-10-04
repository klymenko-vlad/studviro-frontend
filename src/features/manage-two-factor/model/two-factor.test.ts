import { describe, expect, it } from 'vitest';

import { groupSecret } from './two-factor';

describe('groupSecret', () => {
  it('splits a secret into groups of four for typing by hand', () => {
    expect(groupSecret('JBSWY3DPEHPK3PXPABCD')).toBe('JBSW Y3DP EHPK 3PXP ABCD');
  });

  it('keeps a short tail', () => {
    expect(groupSecret('ABCDEF')).toBe('ABCD EF');
  });
});
