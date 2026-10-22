import { describe, expect, it } from 'vitest';

import { toCreatePayload } from './schema';

describe('a class on the institution’s clock (B31)', () => {
  it('stores a 09:00 lecture as 09:00 in the institution', () => {
    const payload = toCreatePayload(
      {
        type: 'lecture',
        title: '',
        date: '2026-11-10',
        from: '09:00',
        to: '10:30',
        roomId: '',
        studyGroupId: '',
        repeatWeekly: false,
      },
      'Europe/Bratislava',
    );

    expect(payload.startsAt).toBe('2026-11-10T08:00:00.000Z');
    expect(payload.endsAt).toBe('2026-11-10T09:30:00.000Z');
  });
});
