export interface CourseFilterOption {
  offeringId: string;
  code: string;
  title: string;
}

interface CourseBearingRow {
  offering: { id: string };
  course: { code: string; title: string };
}

export const ALL_COURSES = 'all';

export function courseFilterOptions(rows: CourseBearingRow[]): CourseFilterOption[] {
  const options = new Map<string, CourseFilterOption>();

  for (const row of rows) {
    options.set(row.offering.id, {
      offeringId: row.offering.id,
      code: row.course.code,
      title: row.course.title,
    });
  }

  return [...options.values()].sort((left, right) => left.code.localeCompare(right.code));
}

/**
 * Radix Select reserves the empty string, so "everything" travels as a sentinel and is
 * turned back into an absent query parameter here rather than in each caller.
 */
export function offeringFilterValue(selection: string): string | undefined {
  return selection === ALL_COURSES ? undefined : selection;
}
