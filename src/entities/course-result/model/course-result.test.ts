import { describe, expect, it } from 'vitest';

import { courseResults } from '@/shared/test';

import {
  creditsEarned,
  groupResultsByTerm,
  isPublished,
  weightedAverage,
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

  it('earns credits only for a published pass', () => {
    expect(creditsEarned(courseResults)).toBe(6);
    expect(
      creditsEarned([{ ...official, effective: { kind: 'official', grade: 'FX' } }]),
    ).toBe(0);
    expect(
      creditsEarned([{ ...official, effective: { kind: 'official', grade: 'failed' } }]),
    ).toBe(0);
  });

  it('weights the average by credits and ignores anything unpublished', () => {
    const second = {
      ...official,
      id: 'second',
      effective: { kind: 'official', grade: 'C' } as const,
      course: { ...official.course, credits: 2 },
    };

    expect(weightedAverage([official, second, proposed])).toBeCloseTo(
      (1 * 6 + 2 * 2) / 8,
      5,
    );
  });

  it('has no average when nothing is published', () => {
    expect(weightedAverage([proposed])).toBeNull();
  });

  it('has no average when a published grade is not on the numeric scale', () => {
    expect(
      weightedAverage([
        { ...official, effective: { kind: 'official', grade: 'passed' } },
      ]),
    ).toBeNull();
  });

  it('ignores a published result whose course carries no credits', () => {
    expect(
      weightedAverage([{ ...official, course: { ...official.course, credits: null } }]),
    ).toBeNull();
  });
});
