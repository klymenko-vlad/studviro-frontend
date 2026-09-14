import type { LearningSpaceDto } from '@/shared/api';

export type LearningSpace = LearningSpaceDto;

/** A space the LMS offers but no SIS offering claims — the import has half a picture. */
export function isUnlinked(space: LearningSpace): boolean {
  return space.offeringId === null;
}

export function dueDate(space: LearningSpace): Date | null {
  return space.nextDueAt === null ? null : new Date(space.nextDueAt);
}
