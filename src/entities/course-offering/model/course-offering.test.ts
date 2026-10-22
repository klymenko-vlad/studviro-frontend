import { describe, expect, it } from 'vitest';

import { courseOfferingHref, offeringItemAnchor } from './course-offering';

describe('courseOfferingHref', () => {
  it('opens the overview when nothing narrower is asked for', () => {
    expect(courseOfferingHref('inst-1', 'off-1')).toBe(
      '/institutions/inst-1/courses/off-1',
    );
  });

  it('opens a section', () => {
    expect(courseOfferingHref('inst-1', 'off-1', { section: 'work' })).toBe(
      '/institutions/inst-1/courses/off-1?section=work',
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
