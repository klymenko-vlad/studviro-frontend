import type { StudyGroupResponseDto } from '@/shared/api';

export type StudyGroup = StudyGroupResponseDto;

export function isFull(group: StudyGroup): boolean {
  return group.capacity !== null && group.members.length >= group.capacity;
}

/** Everybody on the roster who is not yet in this group. */
export function unassigned<T extends { userId: string }>(
  roster: readonly T[],
  group: StudyGroup,
): T[] {
  const inGroup = new Set(group.members.map(member => member.userId));

  return roster.filter(student => !inGroup.has(student.userId));
}
