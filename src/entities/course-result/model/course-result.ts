import type { MyCourseResultResponseDto } from '@/shared/api';

export type CourseResult = MyCourseResultResponseDto;
export type CourseResultTerm = CourseResult['term'];
export type CourseResultKind = NonNullable<CourseResult['effective']>['kind'];
export type CourseResultProvenance = CourseResult['provenance'];

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

const GRADE_POINTS: Record<string, number> = { A: 1, B: 1.5, C: 2, D: 2.5, E: 3, FX: 4 };

export function isPublished(result: CourseResult): boolean {
  return result.effective?.kind === 'official';
}

export function creditsEarned(results: CourseResult[]): number {
  return results
    .filter(
      result =>
        isPublished(result) &&
        result.effective?.grade !== 'FX' &&
        result.effective?.grade !== 'failed',
    )
    .reduce((sum, result) => sum + (result.course.credits ?? 0), 0);
}

export function weightedAverage(results: CourseResult[]): number | null {
  const graded = results.flatMap(result => {
    const points =
      result.effective === null ? undefined : GRADE_POINTS[result.effective.grade];
    const credits = result.course.credits;

    if (!isPublished(result) || points === undefined || credits === null) return [];

    return [{ points, credits }];
  });

  const credits = graded.reduce((sum, entry) => sum + entry.credits, 0);

  if (credits === 0) return null;

  const weighted = graded.reduce((sum, entry) => sum + entry.points * entry.credits, 0);

  return weighted / credits;
}
