import type { ExamRegistrantResponseDto } from '@/shared/api';

import type { OfferingExamTerm } from './offering-exam-term';

export type ExamRegistrant = ExamRegistrantResponseDto;

export const ATTENDANCE_OUTCOMES = ['attended', 'no_show', 'excused'] as const;
export type AttendanceOutcome = (typeof ATTENDANCE_OUTCOMES)[number];

export function isAttendanceOutcome(value: string): value is AttendanceOutcome {
  return (ATTENDANCE_OUTCOMES as readonly string[]).includes(value);
}

/** Attendance means something only for a term that went ahead and has begun. */
export function canRecordAttendance(term: OfferingExamTerm, now: Date): boolean {
  return term.cancelledAt === null && new Date(term.startsAt) <= now;
}
