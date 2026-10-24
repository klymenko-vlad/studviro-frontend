import { describe, expect, it } from 'vitest';

import { clockParts, crossedWarning } from './clock';

describe('the attempt clock', () => {
  it('reads as hours, minutes and seconds left', () => {
    expect(clockParts(0)).toEqual({ hours: 0, minutes: 0, seconds: 0 });
    expect(clockParts(65)).toEqual({ hours: 0, minutes: 1, seconds: 5 });
    expect(clockParts(3723)).toEqual({ hours: 1, minutes: 2, seconds: 3 });
  });

  it('warns once as each mark is passed, and not on every tick', () => {
    expect(crossedWarning(301, 300)).toBe(300);
    expect(crossedWarning(300, 299)).toBeNull();
    expect(crossedWarning(61, 59)).toBe(60);
    expect(crossedWarning(1200, 1199)).toBeNull();
    expect(crossedWarning(null, 50)).toBeNull();
  });
});
