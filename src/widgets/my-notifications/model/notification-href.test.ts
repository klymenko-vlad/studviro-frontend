import { describe, expect, it } from 'vitest';

import type { Notification, NotificationType } from '@/entities/notification';
import { notifications } from '@/shared/test';

import { notificationHref } from './notification-href';

const INSTITUTION = 'inst-1';
const COURSE = `/institutions/${INSTITUTION}/courses/off-1`;

const notification = (type: NotificationType, overrides: Partial<Notification> = {}) =>
  ({
    ...notifications[0]!,
    type,
    courseOfferingId: 'off-1',
    examTermId: null,
    learningActivityId: null,
    discussionThreadId: null,
    ...overrides,
  }) satisfies Notification;

describe('notificationHref', () => {
  it.each([
    'exam_term_published',
    'exam_term_rescheduled',
    'exam_term_cancelled',
    'exam_registration_confirmed',
    'exam_registration_cancelled',
    'exam_registration_refused',
  ] as const)('opens %s on the schedule at its exam term', type => {
    expect(
      notificationHref(INSTITUTION, notification(type, { examTermId: 'term-1' })),
    ).toBe(`${COURSE}?section=schedule#exam-term-term-1`);
  });

  it.each([
    'assignment_due_published',
    'assignment_due_rescheduled',
    'submission_marked',
  ] as const)('opens %s on the assignments at its assignment', type => {
    expect(
      notificationHref(INSTITUTION, notification(type, { learningActivityId: 'act-1' })),
    ).toBe(`${COURSE}?section=assignments#activity-act-1`);
  });

  it.each(['grade_published', 'grade_corrected'] as const)(
    'opens %s on the grades section',
    type => {
      expect(notificationHref(INSTITUTION, notification(type))).toBe(
        `${COURSE}?section=grades`,
      );
    },
  );

  it.each(['timetable_event_rescheduled', 'timetable_event_cancelled'] as const)(
    'opens %s on the calendar, the one place a student sees classes',
    type => {
      expect(notificationHref(INSTITUTION, notification(type))).toBe(
        `/institutions/${INSTITUTION}/calendar`,
      );
    },
  );

  it.each(['enrollment_confirmed', 'enrollment_rejected'] as const)(
    'opens %s on the course itself',
    type => {
      expect(notificationHref(INSTITUTION, notification(type))).toBe(COURSE);
    },
  );

  it.each(['discussion_thread_started', 'discussion_reply'] as const)(
    'opens %s on its thread',
    type => {
      expect(
        notificationHref(
          INSTITUTION,
          notification(type, { discussionThreadId: 'thr-1' }),
        ),
      ).toBe(`${COURSE}?section=discussion&thread=thr-1`);
    },
  );

  it('sends a place that came free to the enrolment screen, which can take it', () => {
    expect(notificationHref(INSTITUTION, notification('waitlist_place_free'))).toBe(
      `/institutions/${INSTITUTION}/courses?tab=find`,
    );
  });

  it('opens the section without an anchor when the item is not named', () => {
    expect(notificationHref(INSTITUTION, notification('exam_term_cancelled'))).toBe(
      `${COURSE}?section=schedule`,
    );
  });

  it('links nowhere when the notification names no course', () => {
    expect(
      notificationHref(
        INSTITUTION,
        notification('grade_published', { courseOfferingId: null }),
      ),
    ).toBeUndefined();
  });
});
