'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTimeZone, useTranslations } from 'next-intl';

import { AssignmentActions, AssignmentForm } from '@/features/manage-assignments';
import { assignmentQueries, type Assignment } from '@/entities/assignment';
import { authorsOffering } from '@/entities/course-offering';
import { usePermissions } from '@/entities/permission';
import type { CourseOfferingResponseDto } from '@/shared/api';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/shared/ui';

import { OfferingMarking } from './offering-marking';
import { OfferingSubmission } from './offering-submission';

export function OfferingAssignments({
  institutionId,
  spaceId,
  viewerRole,
}: {
  institutionId: string;
  spaceId: string;
  viewerRole: CourseOfferingResponseDto['viewerRole'];
}) {
  const t = useTranslations('assignments');
  const format = useFormatter();
  // The offering's own zone, so a deadline reads the same here as it does on
  // the timetable and in the calendar.
  const timeZone = useTimeZone() ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { can } = usePermissions(institutionId);
  const manageable = authorsOffering(viewerRole);
  const marker = can('grade:propose');
  const [editing, setEditing] = useState<string | null>(null);

  const assignments = useQuery(
    assignmentQueries.list({ path: { institutionId, spaceId } }),
  );

  const when = (iso: string | null) =>
    iso === null
      ? t('unset')
      : format.dateTime(new Date(iso), {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone,
        });

  const window = (assignment: Assignment) =>
    t('window', {
      opens: when(assignment.opensAt),
      due: when(assignment.dueAt),
      closes: when(assignment.closesAt),
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {manageable ? (
          <AssignmentForm institutionId={institutionId} spaceId={spaceId} />
        ) : null}

        {assignments.isPending ? (
          <Skeleton className="h-20 w-full" data-testid="offering-assignments-loading" />
        ) : assignments.isError ? (
          <p className="text-muted-foreground text-sm">{t('error')}</p>
        ) : assignments.data.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('empty')}</p>
        ) : (
          <ul className="flex flex-col gap-6" aria-label={t('title')}>
            {assignments.data.map(assignment => (
              <li key={assignment.id} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{assignment.name}</span>
                  {assignment.visible ? null : (
                    <Badge variant="outline">{t('hidden')}</Badge>
                  )}
                  {assignment.allowsLateSubmission ? (
                    <Badge variant="secondary">{t('lateAllowed')}</Badge>
                  ) : null}
                  <Badge variant="outline">
                    {assignment.maxAttempts === null
                      ? t('attemptsUnlimited')
                      : t('attempts', { count: assignment.maxAttempts })}
                  </Badge>
                  {assignment.maxPoints === null ? null : (
                    <Badge variant="outline">
                      {t('points', { maxPoints: assignment.maxPoints })}
                    </Badge>
                  )}
                </div>

                <p className="text-muted-foreground text-sm">{window(assignment)}</p>

                {assignment.brief === null ? null : (
                  <p className="text-sm whitespace-pre-line">{assignment.brief}</p>
                )}

                {manageable ? (
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={t('editNamed', { name: assignment.name })}
                      onClick={() => {
                        setEditing(current =>
                          current === assignment.id ? null : assignment.id,
                        );
                      }}
                    >
                      {editing === assignment.id ? t('cancelEdit') : t('edit')}
                    </Button>
                    <AssignmentActions
                      institutionId={institutionId}
                      spaceId={spaceId}
                      assignment={assignment}
                    />
                  </div>
                ) : null}

                {manageable && editing === assignment.id ? (
                  <AssignmentForm
                    institutionId={institutionId}
                    spaceId={spaceId}
                    assignment={assignment}
                    onDone={() => {
                      setEditing(null);
                    }}
                  />
                ) : null}

                {viewerRole === 'student' ? (
                  <OfferingSubmission
                    institutionId={institutionId}
                    assignment={assignment}
                  />
                ) : marker ? (
                  <OfferingMarking
                    institutionId={institutionId}
                    assignment={assignment}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
