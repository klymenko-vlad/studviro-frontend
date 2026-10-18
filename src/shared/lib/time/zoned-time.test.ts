import { describe, expect, it } from 'vitest';

import { toWallTime, wallTimeToInstant } from './zoned-time';

const BRATISLAVA = 'Europe/Bratislava';

describe('wallTimeToInstant', () => {
  it('reads a typed time as the institution’s clock, not UTC', () => {
    expect(wallTimeToInstant('2026-11-10', '09:00', BRATISLAVA)).toBe(
      '2026-11-10T08:00:00.000Z',
    );
  });

  it('follows summer time', () => {
    expect(wallTimeToInstant('2026-06-10', '09:00', BRATISLAVA)).toBe(
      '2026-06-10T07:00:00.000Z',
    );
  });

  it('is the identity in UTC', () => {
    expect(wallTimeToInstant('2026-11-10', '09:00', 'UTC')).toBe(
      '2026-11-10T09:00:00.000Z',
    );
  });

  it('works for a zone west of Greenwich', () => {
    expect(wallTimeToInstant('2026-01-15', '18:30', 'America/New_York')).toBe(
      '2026-01-15T23:30:00.000Z',
    );
  });

  it('moves a time that does not exist on the spring-forward day forward, as clocks do', () => {
    // 02:30 on 29 March 2026 is skipped in Bratislava; 03:30 CEST is 01:30 UTC.
    expect(wallTimeToInstant('2026-03-29', '02:30', BRATISLAVA)).toBe(
      '2026-03-29T01:30:00.000Z',
    );
  });

  it('takes the first of the two 02:30s on the autumn day', () => {
    expect(wallTimeToInstant('2026-10-25', '02:30', BRATISLAVA)).toBe(
      '2026-10-25T00:30:00.000Z',
    );
  });
});

describe('toWallTime', () => {
  it('shows an instant on the institution’s clock', () => {
    expect(toWallTime('2026-11-10T08:00:00.000Z', BRATISLAVA)).toEqual({
      date: '2026-11-10',
      time: '09:00',
    });
  });

  it('crosses midnight when the zone does', () => {
    expect(toWallTime('2026-11-10T23:30:00.000Z', BRATISLAVA)).toEqual({
      date: '2026-11-11',
      time: '00:30',
    });
  });

  it('round-trips with wallTimeToInstant', () => {
    const { date, time } = toWallTime('2026-06-10T07:00:00.000Z', BRATISLAVA);

    expect(wallTimeToInstant(date, time, BRATISLAVA)).toBe('2026-06-10T07:00:00.000Z');
  });
});
