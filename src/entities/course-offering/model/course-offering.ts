import type { CourseOfferingResponseDto } from '@/shared/api';

export type CourseOffering = CourseOfferingResponseDto;
export type CourseOfferingTeacher = CourseOffering['teachers'][number];
export type CourseOfferingStudyGroup = CourseOffering['studyGroups'][number];
export type CourseOfferingViewerRole = CourseOffering['viewerRole'];

export function courseOfferingHref(institutionId: string, offeringId: string): string {
  return `/institutions/${institutionId}/courses/${offeringId}`;
}

export function teachersByPrecedence(offering: CourseOffering): CourseOfferingTeacher[] {
  return [...offering.teachers].sort(
    (left, right) => Number(right.isPrimary) - Number(left.isPrimary),
  );
}
