'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTimeZone, useTranslations } from 'next-intl';

import { AssignmentActions, AssignmentForm } from '@/features/manage-assignments';
import { assignmentQueries, type Assignment } from '@/entities/assignment';
import { AvailabilityNote } from '@/entities/availability';
import { authorsOffering, offeringItemAnchor } from '@/entities/course-offering';
import { usePermissions } from '@/entities/permission';
import { RestrictionNote } from '@/entities/restriction';
import type { CourseOfferingResponseDto } from '@/shared/api';
import { cn, revealTargetClassName, useRevealHashTarget } from '@/shared/lib';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ListSkeleton,
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
  useRevealHashTarget(assignments.isSuccess);

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
          <ListSkeleton items={2} data-testid="offering-assignments-loading" />
        ) : assignments.isError ? (
          <p className="text-muted-foreground text-sm">{t('error')}</p>
        ) : assignments.data.length === 0 ? (
          <EmptyState size="inline" title={t('empty')} />
        ) : (
          <ul className="flex flex-col gap-6" aria-label={t('title')}>
            {assignments.data.map(assignment => (
              <li
                key={assignment.id}
                id={offeringItemAnchor({ kind: 'activity', id: assignment.id })}
                tabIndex={-1}
                className={cn('flex flex-col gap-3', revealTargetClassName)}
              >
                {!manageable &&
                (assignment.availability === 'scheduled' ||
                  assignment.restriction?.locked === true) ? (
                  <>
                    <span className="font-medium">{assignment.name}</span>
                    <AvailabilityNote item={assignment} audience="student" />
                    <RestrictionNote
                      restriction={assignment.restriction}
                      audience="student"
                    />
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{assignment.name}</span>
                      {assignment.visible ? null : (
                        <Badge variant="outline">{t('hidden')}</Badge>
                      )}
                      {manageable ? (
                        <AvailabilityNote item={assignment} audience="author" />
                      ) : null}
                      {manageable ? (
                        <RestrictionNote
                          restriction={assignment.restriction}
                          audience="author"
                        />
                      ) : null}
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
                    {manageable ? null : (
                      <AvailabilityNote item={assignment} audience="student" />
                    )}

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
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
