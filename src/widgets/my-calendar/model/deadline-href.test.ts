import { describe, expect, it } from 'vitest';

import { deadlines } from '@/shared/test';

import { deadlineHref } from './deadline-href';

const INSTITUTION = 'i1';

describe('deadlineHref', () => {
  it('takes an assignment to its place on the Assignments tab', () => {
    const deadline = { ...deadlines[0]!, type: 'assignment' as const };

    expect(deadlineHref(INSTITUTION, deadline)).toBe(
      `/institutions/i1/courses/${deadline.offering.id}?section=assignments#activity-${deadline.id}`,
    );
  });

  it('takes a quiz to its row in the course outline', () => {
    const deadline = { ...deadlines[0]!, type: 'quiz' as const };

    expect(deadlineHref(INSTITUTION, deadline)).toBe(
      `/institutions/i1/courses/${deadline.offering.id}?section=materials#outline-quiz-${deadline.id}`,
    );
  });
});
