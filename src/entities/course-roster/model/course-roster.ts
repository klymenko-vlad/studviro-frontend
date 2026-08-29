import type { CourseRosterResponseDto } from '@/shared/api';

export type CourseRoster = CourseRosterResponseDto;
export type RosterStudent = CourseRoster['students'][number];

const ENROLLED_STATUSES = new Set<RosterStudent['status']>([
  'active',
  'completed',
  'requested',
  'provisioning',
]);

/** How many of the listed students still hold a place, rather than every row. */
export function enrolledStudents(roster: CourseRoster): RosterStudent[] {
  return roster.students.filter(student => ENROLLED_STATUSES.has(student.status));
}
