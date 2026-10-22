'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { AssignTeacherForm, UnassignTeacherButton } from '@/features/manage-teaching';
import { teachersByPrecedence, type CourseOffering } from '@/entities/course-offering';
import { usePermissions } from '@/entities/permission';
import { byPrecedence, teachingAssignmentQueries } from '@/entities/teaching-assignment';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
} from '@/shared/ui';

export function OfferingStaff({
  offering,
  institutionId,
  offeringId,
}: {
  offering: CourseOffering;
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('courseOffering');
  const { can } = usePermissions(institutionId);

  return can('offering:manage') ? (
    <ManagedStaff institutionId={institutionId} offeringId={offeringId} />
  ) : (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('staff')}</CardTitle>
      </CardHeader>

      <CardContent>
        <StaffList offering={offering} />
      </CardContent>
    </Card>
  );
}

function StaffList({ offering }: { offering: CourseOffering }) {
  const t = useTranslations('courseOffering');
  const teachers = teachersByPrecedence(offering);

  if (teachers.length === 0)
    return <p className="text-muted-foreground text-sm">{t('noStaff')}</p>;

  return (
    <ul aria-label={t('staff')} className="flex flex-col gap-3">
      {teachers.map(teacher => (
        <li
          key={`${teacher.userId}-${teacher.role}`}
          className="flex flex-wrap items-center justify-between gap-2"
        >
          <span className="text-sm">{teacher.displayName}</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{t(`teachingRole.${teacher.role}`)}</Badge>
            {teacher.isPrimary ? <Badge variant="secondary">{t('lead')}</Badge> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Read off the teaching endpoint rather than the offering detail, because only
 * that carries the assignment id an unassign needs.
 */
function ManagedStaff({
  institutionId,
  offeringId,
}: {
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('courseOffering');
  const assignments = useQuery(
    teachingAssignmentQueries.list({ path: { institutionId, offeringId } }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('staff')}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {assignments.isPending ? (
          <Skeleton className="h-16 w-full" data-testid="offering-staff-loading" />
        ) : assignments.isError ? (
          <p className="text-muted-foreground text-sm">{t('staffError')}</p>
        ) : assignments.data.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('noStaff')}</p>
        ) : (
          <ul aria-label={t('staff')} className="flex flex-col gap-3">
            {byPrecedence(assignments.data).map(assignment => (
              <li
                key={assignment.id}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span className="text-sm">{assignment.displayName}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{t(`teachingRole.${assignment.role}`)}</Badge>
                  {assignment.isPrimary ? (
                    <Badge variant="secondary">{t('lead')}</Badge>
                  ) : null}
                  <UnassignTeacherButton
                    institutionId={institutionId}
                    offeringId={offeringId}
                    assignmentId={assignment.id}
                    displayName={assignment.displayName}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        <Separator />

        <AssignTeacherForm institutionId={institutionId} offeringId={offeringId} />
      </CardContent>
    </Card>
  );
}
