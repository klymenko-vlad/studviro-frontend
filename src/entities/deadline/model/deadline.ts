import type { MyDeadlineResponseDto } from '@/shared/api';

export type Deadline = MyDeadlineResponseDto;
export type DeadlineType = Deadline['type'];
export type DeadlineAttendance = Deadline['attendance'];

export type DeadlineState = 'open' | 'upcoming' | 'overdue';

export function deadlineState(deadline: Deadline): DeadlineState {
  if (deadline.isOverdue) return 'overdue';

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
