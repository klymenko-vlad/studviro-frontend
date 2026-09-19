import type { TeachingAssignmentResponseDto } from '@/shared/api';

export type TeachingAssignment = TeachingAssignmentResponseDto;

/** The lead first, then everyone else by name, which is the order they read in. */
export function byPrecedence(
  assignments: readonly TeachingAssignment[],
): TeachingAssignment[] {
  return [...assignments].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;

    return a.displayName.localeCompare(b.displayName);
  });
}
