import type { CourseOfferingListItemDto } from '@/shared/api';

export type AdminCourseOffering = CourseOfferingListItemDto;

/** Newest term first is the API's order; within a term, group under one heading. */
export function byTerm(
  offerings: readonly AdminCourseOffering[],
): { termId: string; termName: string; offerings: AdminCourseOffering[] }[] {
  const grouped: {
    termId: string;
    termName: string;
    offerings: AdminCourseOffering[];
  }[] = [];

  for (const offering of offerings) {
    const last = grouped.at(-1);
    if (last?.termId === offering.academicTermId) last.offerings.push(offering);
    else
      grouped.push({
        termId: offering.academicTermId,
        termName: offering.termName,
        offerings: [offering],
      });
  }

  return grouped;
}

/** A course nobody can teach is a hole an administrator should be able to see. */
export function hasNoTeacher(offering: AdminCourseOffering): boolean {
  return offering.teacherCount === 0;
}

export function isFull(offering: AdminCourseOffering): boolean {
  return offering.capacity !== null && offering.enrolled >= offering.capacity;
}
