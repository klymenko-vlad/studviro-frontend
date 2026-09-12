import type { CourseRosterResponseDto } from '@/shared/api';

export type CourseRoster = CourseRosterResponseDto;
export type RosterStudent = CourseRoster['students'][number];

/**
 * Mirrors the server's ENROLLMENT_RECORDED_STATUSES. The roster endpoint already excludes
 * everyone else, so this is a guard against a stale cache rather than the rule itself --
 * `requested` is absent here because a student awaiting approval holds no place.
 */
const ENROLLED_STATUSES = new Set<RosterStudent['status']>([
  'active',
  'completed',
  'provisioning',
]);

/** How many of the listed students still hold a place, rather than every row. */
export function enrolledStudents(roster: CourseRoster): RosterStudent[] {
  return roster.students.filter(student => ENROLLED_STATUSES.has(student.status));
}
