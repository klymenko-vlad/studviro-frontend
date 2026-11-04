import { courseOfferingHref, type OfferingTarget } from '@/entities/course-offering';
import type { Notification } from '@/entities/notification';
import { institutionRoutes } from '@/shared/config';

/**
 * Where following a notification lands: the course's tab that holds the thing
 * it is about, scrolled to that thing where the notification names it. A
 * class lives on the calendar, since a student's schedule tab lists only
 * exams. A queueing student holds no place, so the course page would refuse them; the
 * place that came free is taken from the enrolment screen, and so is a withdrawal, since
 * the course page stays open after one only when a grade was already recorded.
 */
export function notificationHref(
  institutionId: string,
  notification: Notification,
): string | undefined {
  const routes = institutionRoutes(institutionId);
  if (
    notification.type === 'waitlist_place_free' ||
    notification.type === 'enrollment_withdrawn'
  ) {
    return routes.enroll;
  }
  if (
    notification.type === 'timetable_event_rescheduled' ||
    notification.type === 'timetable_event_cancelled'
  ) {
    return routes.calendar;
  }
  if (notification.courseOfferingId === null) return undefined;

  return courseOfferingHref(
    institutionId,
    notification.courseOfferingId,
    targetOf(notification),
  );
}

function targetOf(notification: Notification): OfferingTarget | undefined {
  const { examTermId, learningActivityId, discussionThreadId } = notification;

  switch (notification.type) {
    case 'exam_term_published':
    case 'exam_term_rescheduled':
    case 'exam_term_cancelled':
    case 'exam_registration_confirmed':
    case 'exam_registration_cancelled':
    case 'exam_registration_refused':
      return {
        section: 'schedule',
        ...(examTermId === null ? {} : { item: { kind: 'exam-term', id: examTermId } }),
      };
    case 'assignment_due_published':
    case 'assignment_due_rescheduled':
    case 'submission_marked':
      return {
        section: 'assignments',
        ...(learningActivityId === null
          ? {}
          : { item: { kind: 'activity', id: learningActivityId } }),
      };
    case 'grade_published':
    case 'grade_corrected':
      return { section: 'grades' };
    case 'discussion_thread_started':
    case 'discussion_reply':
      return {
        section: 'discussion',
        ...(discussionThreadId === null
          ? {}
          : { params: { thread: discussionThreadId } }),
      };
    case 'enrollment_confirmed':
    case 'enrollment_rejected':
    case 'timetable_event_rescheduled':
    case 'timetable_event_cancelled':
    case 'waitlist_place_free':
    case 'enrollment_withdrawn':
      return undefined;
  }
}
