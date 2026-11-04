import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { WithdrawStudentButton } from '@/features/withdraw-enrollment';
import {
  courseRosterQueries,
  enrolledStudents,
  RosterTable,
} from '@/entities/course-roster';
import { usePermissions } from '@/entities/permission';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  QueryError,
  TableSkeleton,
} from '@/shared/ui';

export function OfferingRoster({
  institutionId,
  offeringId,
}: {
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('roster');
  const { can } = usePermissions(institutionId);
  const { data, isPending, isError, refetch } = useQuery(
    courseRosterQueries.detail({ path: { institutionId, offeringId } }),
  );

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">{t('panelTitle')}</CardTitle>
        {isPending || isError ? null : (
          <p className="text-muted-foreground text-sm">
            {data.offering.capacity === null
              ? t('summary', {
                  enrolled: enrolledStudents(data).length,
                  total: data.students.length,
                })
              : t('summaryWithCapacity', {
                  enrolled: enrolledStudents(data).length,
                  total: data.students.length,
                  capacity: data.offering.capacity,
                })}
          </p>
        )}
      </CardHeader>

      <CardContent className="text-sm">
        {isPending ? (
          <TableSkeleton rows={4} data-testid="offering-roster-loading" />
        ) : isError ? (
          <QueryError
            onRetry={refetch}
            title={t('errorTitle')}
            description={t('errorDescription')}
          />
        ) : data.students.length === 0 ? (
          <EmptyState size="inline" title={t('empty')} />
        ) : (
          <RosterTable
            students={data.students}
            caption={t('tableCaption')}
            actionFor={
              can('enrollment:manage')
                ? student => (
                    <WithdrawStudentButton
                      institutionId={institutionId}
                      offeringId={offeringId}
                      enrollmentId={student.enrollmentId}
                      studentName={student.displayName}
                    />
                  )
                : undefined
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
