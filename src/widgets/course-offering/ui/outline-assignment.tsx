'use client';

import type { ReactNode } from 'react';
import { useFormatter, useTimeZone, useTranslations } from 'next-intl';

import type { Assignment } from '@/entities/assignment';
import { AvailabilityNote } from '@/entities/availability';
import { courseOfferingHref } from '@/entities/course-offering';
import { Link } from '@/shared/config';
import { Badge } from '@/shared/ui';

export function OutlineAssignment({
  institutionId,
  offeringId,
  assignment,
  manageable,
  actions,
  readOnly = false,
}: {
  institutionId: string;
  offeringId: string;
  assignment: Assignment;
  manageable: boolean;
  actions: ReactNode;
  readOnly?: boolean;
}) {
  const t = useTranslations('outline');
  const format = useFormatter();
  const timeZone = useTimeZone() ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (
    !manageable &&
    (assignment.availability === 'scheduled' || assignment.restriction?.locked === true)
  ) {
    return (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{assignment.name}</span>
          <Badge variant="secondary">{t('assignment')}</Badge>
        </div>
        <AvailabilityNote item={assignment} audience="student" />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {readOnly ? (
          <span className="font-medium">{assignment.name}</span>
        ) : (
          <Link
            href={courseOfferingHref(institutionId, offeringId, {
              section: 'assignments',
              item: { kind: 'activity', id: assignment.id },
            })}
            className="font-medium underline-offset-4 hover:underline"
          >
            {assignment.name}
          </Link>
        )}
        <Badge variant="secondary">{t('assignment')}</Badge>
        {assignment.visible ? null : <Badge variant="outline">{t('hidden')}</Badge>}
        {manageable ? <AvailabilityNote item={assignment} audience="author" /> : null}
        {actions}
      </div>
      <p className="text-muted-foreground text-sm">
        {assignment.dueAt === null
          ? t('noDueDate')
          : t('due', {
              when: format.dateTime(new Date(assignment.dueAt), {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone,
              }),
            })}
      </p>
      {manageable ? null : <AvailabilityNote item={assignment} audience="student" />}
    </>
  );
}
