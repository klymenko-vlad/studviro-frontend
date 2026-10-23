import { describe, expect, it } from 'vitest';

import { isDone, progressOf, sectionTally, type Progress } from './completion';

const progress: Progress = {
  done: 1,
  total: 2,
  sections: [
    { sectionId: null, done: 1, total: 1 },
    { sectionId: 'week-1', done: 0, total: 1 },
  ],
  items: [
    {
      kind: 'material',
      id: 'notes',
      sectionId: null,
      rule: 'manual',
      state: 'complete',
      completedAt: '2026-10-01T09:00:00.000Z',
    },
    {
      kind: 'assignment',
      id: 'a1',
      sectionId: 'week-1',
      rule: 'passed',
      state: 'complete_fail',
      completedAt: '2026-10-02T09:00:00.000Z',
    },
  ],
};

describe('isDone', () => {
  it('counts complete and a pass, and not a fail or nothing', () => {
    expect(isDone('complete')).toBe(true);
    expect(isDone('complete_pass')).toBe(true);
    expect(isDone('complete_fail')).toBe(false);
    expect(isDone('incomplete')).toBe(false);
  });
});

describe('progressOf', () => {
  it('finds an item’s own state', () => {
    expect(progressOf(progress, 'a1')?.state).toBe('complete_fail');
  });

  it('has nothing for an untracked item or before progress has loaded', () => {
    expect(progressOf(progress, 'untracked')).toBeUndefined();
    expect(progressOf(undefined, 'a1')).toBeUndefined();
  });
});

describe('sectionTally', () => {
  it('reads the general area and a section apart', () => {
    expect(sectionTally(progress, null)).toEqual({ sectionId: null, done: 1, total: 1 });
    expect(sectionTally(progress, 'week-1')).toMatchObject({ done: 0, total: 1 });
  });

  it('has nothing for a section with no tracked items', () => {
    expect(sectionTally(progress, 'week-9')).toBeUndefined();
  });
});
