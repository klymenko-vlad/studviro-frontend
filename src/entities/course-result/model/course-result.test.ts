import { describe, expect, it } from 'vitest';

import { courseResults } from '@/shared/test';

import {
  groupResultsByTerm,
  hasFailed,
  hasStanding,
  isPublished,
  termCredits,
} from './course-result';

const [official, proposed] = courseResults as [
  (typeof courseResults)[number],
  (typeof courseResults)[number],
];

describe('course result model', () => {
  it('groups consecutive results of the same term together', () => {
    const groups = groupResultsByTerm([official, { ...official, id: 'second' }]);

    expect(groups).toHaveLength(1);
    expect(groups[0]!.results).toHaveLength(2);
    expect(groups[0]!.term.name).toBe('Summer 2026');
  });

  it('keeps the order the API returned rather than merging distant terms', () => {
    const groups = groupResultsByTerm([official, proposed, { ...official, id: 'third' }]);

    expect(groups.map(group => group.term.code)).toEqual([
      '2026-SS',
      '2025-WS',
      '2026-SS',
    ]);
  });

  it('groups nothing into nothing', () => {
    expect(groupResultsByTerm([])).toEqual([]);
  });

  it('counts only an official grade as published', () => {
    expect(isPublished(official)).toBe(true);
    expect(isPublished(proposed)).toBe(false);
  });

  it('counts a term’s credits from the passes it holds', () => {
    expect(termCredits(courseResults)).toBe(6);
  });

  it('counts no credits for a failed course', () => {
    expect(
      termCredits([
        { ...official, effective: { kind: 'official', grade: 'FX', passed: false } },
      ]),
    ).toBe(0);
  });

  it('counts no credits for a course with no result yet', () => {
    expect(termCredits([{ ...official, effective: null }])).toBe(0);
  });

  it('counts no credits for a grade the registrar has not published', () => {
    expect(termCredits([proposed])).toBe(0);
  });

  it('treats a result the server gave no effective grade as having no standing', () => {
    expect(hasStanding({ ...official, effective: null, isVoided: true })).toBe(false);
    expect(hasStanding(official)).toBe(true);
  });

  it('reads pass and fail from the server’s answer rather than deciding again', () => {
    expect(hasFailed(official)).toBe(false);
    expect(
      hasFailed({
        ...official,
        effective: { kind: 'official', grade: 'FX', passed: false },
      }),
    ).toBe(true);
  });
});
