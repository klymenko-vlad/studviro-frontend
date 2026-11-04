import { courseOfferingHref } from '@/entities/course-offering';
import type { Deadline } from '@/entities/deadline';
import { outlineAnchor } from '@/entities/learning-section';

export function deadlineHref(institutionId: string, deadline: Deadline): string {
  if (deadline.type === 'quiz') {
    const content = courseOfferingHref(institutionId, deadline.offering.id, {
      section: 'materials',
    });

    return `${content}#${outlineAnchor('quiz', deadline.id)}`;
  }

  return courseOfferingHref(institutionId, deadline.offering.id, {
    section: 'assignments',
    ...(deadline.type === 'assignment'
      ? { item: { kind: 'activity', id: deadline.id } }
      : {}),
  });
}
