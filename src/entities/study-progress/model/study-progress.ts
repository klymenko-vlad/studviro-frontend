import type { StudyProgressResponseDto } from '@/shared/api';

export type StudyProgress = StudyProgressResponseDto;
export type ProgrammeStanding = StudyProgress['programmes'][number];

/**
 * A programme with no recorded length has no denominator, and the API says so
 * with nulls rather than guessing. The screen must not guess either: it shows
 * the credits earned and no bar at all.
 */
export function hasTarget(standing: ProgrammeStanding): boolean {
  return standing.creditsRequired !== null && standing.percentComplete !== null;
}

/** Clamped for the bar's width; the API already caps the number it reports. */
export function barPercent(standing: ProgrammeStanding): number {
  return Math.max(0, Math.min(100, standing.percentComplete ?? 0));
}
