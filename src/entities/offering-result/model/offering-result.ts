import type {
  OfferingResultAttemptDto,
  OfferingResultsResponseDto,
  OfferingResultStudentDto,
} from '@/shared/api';

export type OfferingResults = OfferingResultsResponseDto;
export type OfferingResultStudent = OfferingResultStudentDto;
export type OfferingResultAttempt = OfferingResultAttemptDto;
export type RecordableGrade = NonNullable<OfferingResultAttempt['official']['grade']>;

export const RECORDABLE_GRADES: RecordableGrade[] = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'FX',
  'passed',
  'failed',
];

/** The sitting a teacher is looking at: the last one, or the first if there is none. */
export function currentAttempt(
  student: OfferingResultStudent,
): OfferingResultAttempt | null {
  return student.attempts.at(-1) ?? null;
}

/**
 * The grade a teacher would be changing. The published one wins, because that
 * is what the student stands on.
 */
export function standingGrade(
  attempt: OfferingResultAttempt | null,
): RecordableGrade | null {
  if (attempt === null || attempt.isVoided) return null;

  return attempt.official.grade ?? attempt.proposed.grade ?? null;
}

/** Whether the registrar owns this row, so an edit here is a disagreement. */
export function isSourced(attempt: OfferingResultAttempt | null): boolean {
  return attempt !== null && attempt.provenance.sourceSystem !== 'platform';
}
