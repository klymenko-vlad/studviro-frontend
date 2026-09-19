import type { CourseOfferingResponseDto } from '@/shared/api';

export type CourseOffering = CourseOfferingResponseDto;
export type CourseOfferingTeacher = CourseOffering['teachers'][number];
export type CourseOfferingStudyGroup = CourseOffering['studyGroups'][number];
export type CourseOfferingViewerRole = CourseOffering['viewerRole'];

/**
 * Whether this viewer may author the course's own page.
 *
 * The server answers it per offering — `teacher` means they teach this one —
 * so the client must not re-derive it from `offering:manage`, which is held at
 * the institution and which a teacher does not hold at all.
 */
export function authorsOffering(viewerRole: CourseOfferingViewerRole): boolean {
  return viewerRole === 'teacher' || viewerRole === 'administrator';
}

export function courseOfferingHref(institutionId: string, offeringId: string): string {
  return `/institutions/${institutionId}/courses/${offeringId}`;
}

export function teachersByPrecedence(offering: CourseOffering): CourseOfferingTeacher[] {
  return [...offering.teachers].sort(
    (left, right) => Number(right.isPrimary) - Number(left.isPrimary),
  );
}
