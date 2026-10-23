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

export type OfferingSection =
  | 'overview'
  | 'materials'
  | 'assignments'
  | 'schedule'
  | 'grades'
  | 'discussion'
  | 'progress'
  | 'people';

export interface OfferingItem {
  kind: 'activity' | 'exam-term';
  id: string;
}

export interface OfferingTarget {
  section: OfferingSection;
  item?: OfferingItem;
  params?: Record<string, string>;
}

export function offeringItemAnchor(item: OfferingItem): string {
  return `${item.kind}-${item.id}`;
}

export function courseOfferingHref(
  institutionId: string,
  offeringId: string,
  target?: OfferingTarget,
): string {
  const page = `/institutions/${institutionId}/courses/${offeringId}`;
  if (target === undefined) return page;

  const query = new URLSearchParams({ section: target.section, ...target.params });
  const anchor = target.item === undefined ? '' : `#${offeringItemAnchor(target.item)}`;
  return `${page}?${query.toString()}${anchor}`;
}

export function teachersByPrecedence(offering: CourseOffering): CourseOfferingTeacher[] {
  return [...offering.teachers].sort(
    (left, right) => Number(right.isPrimary) - Number(left.isPrimary),
  );
}
