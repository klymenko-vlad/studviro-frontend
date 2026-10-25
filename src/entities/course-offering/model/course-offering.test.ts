import { describe, expect, it } from 'vitest';

import {
  courseOfferingHref,
  offeringItemAnchor,
  takesPartInDiscussion,
  type CourseOffering,
} from './course-offering';

describe('courseOfferingHref', () => {
  it('opens the overview when nothing narrower is asked for', () => {
    expect(courseOfferingHref('inst-1', 'off-1')).toBe(
      '/institutions/inst-1/courses/off-1',
    );
  });

  it('opens a section', () => {
    expect(courseOfferingHref('inst-1', 'off-1', { section: 'grades' })).toBe(
      '/institutions/inst-1/courses/off-1?section=grades',
    );
  });

  it('opens a section scrolled to one of its items', () => {
    expect(
      courseOfferingHref('inst-1', 'off-1', {
        section: 'schedule',
        item: { kind: 'exam-term', id: 'term-9' },
      }),
    ).toBe('/institutions/inst-1/courses/off-1?section=schedule#exam-term-term-9');
  });

  it('carries extra parameters after the section', () => {
    expect(
      courseOfferingHref('inst-1', 'off-1', {
        section: 'discussion',
        params: { thread: 'thread-3' },
      }),
    ).toBe('/institutions/inst-1/courses/off-1?section=discussion&thread=thread-3');
  });
});

describe('offeringItemAnchor', () => {
  it('prefixes the id with its kind so two kinds never collide', () => {
    expect(offeringItemAnchor({ kind: 'activity', id: 'a-1' })).toBe('activity-a-1');
  });
});

describe('takesPartInDiscussion', () => {
  const as = (
    viewerRole: CourseOffering['viewerRole'],
    status?: NonNullable<CourseOffering['enrollment']>['status'],
  ) => ({
    viewerRole,
    enrollment:
      status === undefined
        ? null
        : {
            enrollmentId: 'enr-1',
            status,
            requirementType: 'compulsory' as const,
            attempt: 1,
            enrolledAt: null,
          },
  });

  it('lets whoever teaches or administers the course take part', () => {
    expect(takesPartInDiscussion(as('teacher'))).toBe(true);
    expect(takesPartInDiscussion(as('administrator'))).toBe(true);
  });

  it('lets a student who is in the course now take part', () => {
    expect(takesPartInDiscussion(as('student', 'active'))).toBe(true);
    expect(takesPartInDiscussion(as('student', 'provisioning'))).toBe(true);
  });

  it('closes the discussion to a student whose course is behind them', () => {
    expect(takesPartInDiscussion(as('student', 'completed'))).toBe(false);
  });

  it('closes it to a student with no seat in the course', () => {
    expect(takesPartInDiscussion(as('student', 'waitlisted'))).toBe(false);
    expect(takesPartInDiscussion(as('student', 'withdrawn'))).toBe(false);
    expect(takesPartInDiscussion(as('student'))).toBe(false);
  });
});
