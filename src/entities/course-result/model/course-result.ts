import type { MyCourseResultResponseDto, StudyProgressResponseDto } from '@/shared/api';

export type CourseResult = MyCourseResultResponseDto;
export type StudyProgress = StudyProgressResponseDto;
export type CourseResultTerm = CourseResult['term'];
export type CourseResultKind = NonNullable<CourseResult['effective']>['kind'];

export interface TermResults {
  term: CourseResultTerm;
  results: CourseResult[];
}

export function groupResultsByTerm(results: CourseResult[]): TermResults[] {
  const groups: TermResults[] = [];

  for (const result of results) {
    const current = groups.at(-1);

    if (current?.term.id === result.term.id) current.results.push(result);
    else groups.push({ term: result.term, results: [result] });
  }

  return groups;
}

export function isPublished(result: CourseResult): boolean {
  return result.effective?.kind === 'official';
}

/**
 * Whether the result has standing at all. An annulled one carries a grade on
 * the record and none in the student's standing, which the server already
 * decided by leaving `effective` null.
 */
export function hasStanding(result: CourseResult): boolean {
  return result.effective !== null;
}

export function hasFailed(result: CourseResult): boolean {
  return result.effective !== null && !result.effective.passed;
}

/**
 * Credits within one term, for the per-term heading. The totals that matter —
 * credits earned, the weighted average, what is awaiting a resit — come from
 * `GET .../me/course-results/summary`, because pass, fail and the point scale
 * are the server's rule and the client must not keep a second copy.
 */
export function termCredits(results: CourseResult[]): number {
  return results
    .filter(result => isPublished(result) && result.effective?.passed === true)
    .reduce((sum, result) => sum + (result.course.credits ?? 0), 0);
}
