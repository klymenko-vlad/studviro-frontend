import { describe, expect, it } from 'vitest';

import { EMPTY_EXAM_TERM, examTermFormSchema } from './schema';

const values = (overrides: Partial<typeof EMPTY_EXAM_TERM> = {}) => ({
  ...EMPTY_EXAM_TERM,
  date: '2026-12-15',
  ...overrides,
});

const issuesAt = (overrides: Partial<typeof EMPTY_EXAM_TERM>) => {
  const result = examTermFormSchema.safeParse(values(overrides));

  return result.success ? [] : result.error.issues.map(issue => issue.path.join('.'));
};

describe('examTermFormSchema', () => {
  it('accepts a term with no registration window, which then closes at the exam', () => {
    expect(issuesAt({})).toEqual([]);
  });

  it('refuses a window that opens only after the exam day', () => {
    expect(issuesAt({ opensOn: '2026-12-16' })).toEqual(['opensOn']);
  });

  it('refuses a window that closes after the exam day', () => {
    expect(issuesAt({ closesOn: '2026-12-16' })).toEqual(['closesOn']);
  });
});
