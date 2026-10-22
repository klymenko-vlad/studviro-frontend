import type { NotificationResponseDto } from '@/shared/api';

export type NotificationType = NotificationResponseDto['type'];

/**
 * Eighteen switches would be a form nobody reads. The account offers five, one
 * per kind of news, and each switches every type in its group.
 */
export const NOTIFICATION_MAIL_GROUPS = [
  {
    key: 'exams',
    types: [
      'exam_term_published',
      'exam_term_rescheduled',
      'exam_term_cancelled',
      'exam_registration_confirmed',
      'exam_registration_cancelled',
      'exam_registration_refused',
    ],
  },
  {
    key: 'coursework',
    types: [
      'assignment_due_published',
      'assignment_due_rescheduled',
      'submission_marked',
      'grade_published',
      'grade_corrected',
    ],
  },
  {
    key: 'enrolment',
    types: ['enrollment_confirmed', 'enrollment_rejected', 'waitlist_place_free'],
  },
  {
    key: 'timetable',
    types: ['timetable_event_rescheduled', 'timetable_event_cancelled'],
  },
  {
    key: 'discussion',
    types: ['discussion_thread_started', 'discussion_reply'],
  },
] as const satisfies readonly { key: string; types: readonly NotificationType[] }[];

export type NotificationMailGroup = (typeof NOTIFICATION_MAIL_GROUPS)[number];

export function isGroupOn(
  group: NotificationMailGroup,
  chosen: readonly NotificationType[],
) {
  return group.types.every(type => chosen.includes(type));
}

/** The whole set after one group is switched; other groups are left as they are. */
export function withGroup(
  chosen: readonly NotificationType[],
  group: NotificationMailGroup,
  on: boolean,
): NotificationType[] {
  const others = chosen.filter(
    type => !(group.types as readonly string[]).includes(type),
  );

  return on ? [...others, ...group.types] : others;
}
