import { describe, expect, it } from 'vitest';

import { soonest } from './up-next';

const NOW = new Date('2026-10-22T12:00:00.000Z');

describe('soonest', () => {
  it('picks the nearest thing still ahead', () => {
    expect(
      soonest(
        [
          { id: 'later', at: '2026-11-05T09:00:00.000Z' },
          { id: 'next', at: '2026-10-23T09:00:00.000Z' },
          { id: 'past', at: '2026-10-01T09:00:00.000Z' },
        ],
        NOW,
      )?.id,
    ).toBe('next');
  });

  it('says there is nothing when everything is behind us', () => {
    expect(soonest([{ id: 'past', at: '2026-10-01T09:00:00.000Z' }], NOW)).toBeNull();
  });
});
