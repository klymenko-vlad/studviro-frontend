import type { AssignmentResponseDto } from '@/shared/api';

export type Assignment = AssignmentResponseDto;

/**
 * With no explicit `closesAt`, the due date closes the assignment unless late
 * work is accepted (ADR 0028). This reports the date the server will enforce;
 * whether that date has passed is the server's to decide, not ours.
 */
export function effectiveClose(assignment: Assignment): string | null {
  if (assignment.closesAt !== null) return assignment.closesAt;

  return assignment.allowsLateSubmission ? null : assignment.dueAt;
}
