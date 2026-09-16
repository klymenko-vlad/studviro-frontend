import type { MyDeadlineResponseDto } from '@/shared/api';

export type Deadline = MyDeadlineResponseDto;
export type DeadlineType = Deadline['type'];
export type DeadlineAttendance = Deadline['attendance'];

export type DeadlineSubmission = NonNullable<Deadline['submission']>;

export type DeadlineState = 'open' | 'upcoming' | 'overdue' | 'handedIn' | 'missed';

/**
 * A deadline the learner already met is not "past due" — the LMS knows the work
 * arrived, so only an unmet deadline that has passed is a miss.
 */
export function deadlineState(deadline: Deadline): DeadlineState {
  if (deadline.submission !== null) return 'handedIn';
  if (deadline.isOverdue)
    return deadline.attendance === 'teaching' ? 'overdue' : 'missed';

  return deadline.isOpen ? 'open' : 'upcoming';
}

export function sortByDueDate(deadlines: Deadline[]): Deadline[] {
  return [...deadlines].sort(
    (left, right) =>
      left.dueAt.localeCompare(right.dueAt) || left.name.localeCompare(right.name),
  );
}

export function nextDeadlines(deadlines: Deadline[], count: number): Deadline[] {
  return sortByDueDate(deadlines.filter(deadline => !deadline.isOverdue)).slice(0, count);
}
