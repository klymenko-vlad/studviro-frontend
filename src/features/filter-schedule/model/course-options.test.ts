import { describe, expect, it } from 'vitest';

import { ALL_COURSES, courseFilterOptions, offeringFilterValue } from './course-options';

const row = (id: string, code: string, title = code) => ({
  offering: { id },
  course: { code, title },
});

describe('courseFilterOptions', () => {
  it('names each offering once however many rows it carries', () => {
    const options = courseFilterOptions([
      row('offering-1', 'INF/ALG/22', 'Algorithms'),
      row('offering-1', 'INF/ALG/22', 'Algorithms'),
    ]);

    expect(options).toEqual([
      { offeringId: 'offering-1', code: 'INF/ALG/22', title: 'Algorithms' },
    ]);
  });

  it('orders the courses by code so the list does not move between weeks', () => {
    const options = courseFilterOptions([
      row('offering-2', 'INF/DB/22'),
      row('offering-1', 'INF/ALG/22'),
    ]);

    expect(options.map(option => option.code)).toEqual(['INF/ALG/22', 'INF/DB/22']);
  });

  it('offers nothing when there is nothing to filter', () => {
    expect(courseFilterOptions([])).toEqual([]);
  });
});

describe('offeringFilterValue', () => {
  it('turns the everything sentinel into an absent filter', () => {
    expect(offeringFilterValue(ALL_COURSES)).toBeUndefined();
  });

  it('passes a chosen offering through untouched', () => {
    expect(offeringFilterValue('offering-1')).toBe('offering-1');
  });
});
