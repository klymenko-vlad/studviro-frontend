import { describe, expect, it } from 'vitest';

import { currentOrNextTerm, termAfter, termProgress, termWeek } from './current-term';

const WINTER = {
  id: 'w',
  startsAt: '2026-09-21T00:00:00.000Z',
  endsAt: '2027-02-14T00:00:00.000Z',
};
const SUMMER = {
  id: 's',
  startsAt: '2027-02-15T00:00:00.000Z',
  endsAt: '2027-07-11T00:00:00.000Z',
};
const LAST = {
  id: 'l',
  startsAt: '2026-02-01T00:00:00.000Z',
  endsAt: '2026-06-30T00:00:00.000Z',
};

describe('currentOrNextTerm', () => {
  it('picks the term running now, whatever the order', () => {
    expect(currentOrNextTerm([SUMMER, WINTER, LAST], new Date('2026-10-04'))).toBe(
      WINTER,
    );
  });

  it('picks the next term to start between terms', () => {
    expect(currentOrNextTerm([SUMMER, WINTER, LAST], new Date('2026-08-01'))).toBe(
      WINTER,
    );
  });

  it('counts the first day of a term as part of it', () => {
    expect(currentOrNextTerm([WINTER], new Date(WINTER.startsAt))).toBe(WINTER);
  });

  it('never answers with a term that has ended', () => {
    expect(currentOrNextTerm([LAST], new Date('2026-10-04'))).toBeNull();
  });

  it('has no answer for no terms', () => {
    expect(currentOrNextTerm([], new Date('2026-10-04'))).toBeNull();
  });
});

describe('termAfter', () => {
  it('names the term that follows', () => {
    expect(termAfter([SUMMER, WINTER, LAST], WINTER)).toBe(SUMMER);
  });

  it('has none after the last term on the books', () => {
    expect(termAfter([WINTER, SUMMER], SUMMER)).toBeNull();
  });
});

describe('termProgress', () => {
  it('is zero before the term and a hundred after it', () => {
    expect(termProgress(WINTER, new Date('2026-01-01'))).toBe(0);
    expect(termProgress(WINTER, new Date('2028-01-01'))).toBe(100);
  });

  it('measures the share of the term gone', () => {
    expect(termProgress(WINTER, new Date('2026-12-03T00:00:00.000Z'))).toBe(50);
  });
});

describe('termWeek', () => {
  it('counts the first day as week one', () => {
    expect(termWeek(WINTER, new Date(WINTER.startsAt))).toEqual({ week: 1, weeks: 21 });
  });

  it('counts whole weeks gone', () => {
    expect(termWeek(WINTER, new Date('2026-10-05T00:00:00.000Z'))).toEqual({
      week: 3,
      weeks: 21,
    });
  });
});
