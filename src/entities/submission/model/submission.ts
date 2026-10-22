import type { SubmissionResponseDto } from '@/shared/api';

export type Submission = SubmissionResponseDto;

/** The highest-numbered attempt — the one that counts. */
export function latest(submissions: readonly Submission[]): Submission | null {
  return submissions.reduce<Submission | null>(
    (best, candidate) =>
      best === null || candidate.attempt > best.attempt ? candidate : best,
    null,
  );
}

/**
 * How many attempts are left under the policy. `null` means the assignment set
 * no limit. The server refuses an attempt past the limit regardless; this only
 * decides what the screen says before they try.
 */
export function attemptsLeft(
  submissions: readonly Submission[],
  maxAttempts: number | null,
): number | null {
  if (maxAttempts === null) return null;

  return Math.max(0, maxAttempts - submissions.length);
}
