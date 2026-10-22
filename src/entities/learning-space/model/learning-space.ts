import type { LearningSpaceDto, LearningSpaceListResponseDto } from '@/shared/api';

export type LearningSpace = LearningSpaceDto;

/**
 * A page whose course is gone. Every page is authored against an offering (ADR
 * 0028), so this only happens when that offering is later withdrawn — the page
 * is still there and no longer says which course it is for.
 */
export function isUnlinked(space: LearningSpace): boolean {
  return space.offeringId === null;
}

export function dueDate(space: LearningSpace): Date | null {
  return space.nextDueAt === null ? null : new Date(space.nextDueAt);
}

/** At most one space exists per offering; the list endpoint still returns a list. */
export function spaceForOffering(
  list: LearningSpaceListResponseDto,
  offeringId: string,
): LearningSpace | null {
  return list.spaces.find(space => space.offeringId === offeringId) ?? null;
}
