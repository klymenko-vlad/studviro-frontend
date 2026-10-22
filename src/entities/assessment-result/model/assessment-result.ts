import type { MyAssessmentResultResponseDto } from '@/shared/api';

export type AssessmentResult = MyAssessmentResultResponseDto;
export type AssessmentSubmission = NonNullable<
  NonNullable<AssessmentResult['activity']>['submission']
>;
export type SubmissionState = AssessmentSubmission['state'];

/** Only the marks that count, and only once each has a share of a maximum. */
export function weightedPercentage(results: AssessmentResult[]): number | null {
  const counted = results.filter(
    result => result.countsTowardFinalGrade && result.percentage !== null,
  );

  if (counted.length === 0) return null;

  const total = counted.reduce((sum, result) => sum + (result.percentage ?? 0), 0);

  return Math.round((total / counted.length) * 10) / 10;
}

export function isMarked(result: AssessmentResult): boolean {
  return result.points !== null;
}
