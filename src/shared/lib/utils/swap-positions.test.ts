import { describe, expect, it } from 'vitest';

import { swapPositions } from './swap-positions';

describe('swapPositions', () => {
  it('trades two different positions', () => {
    expect(swapPositions(3, 1, true)).toEqual([1, 3]);
    expect(swapPositions(1, 3, false)).toEqual([3, 1]);
  });

  it('still moves an item past a neighbour that shares its position', () => {
    expect(swapPositions(2, 2, true)).toEqual([2, 3]);
    expect(swapPositions(2, 2, false)).toEqual([3, 2]);
  });
});
