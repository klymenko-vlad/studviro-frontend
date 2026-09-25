'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTimeZone, useTranslations } from 'next-intl';

import { MarkSubmissionForm } from '@/features/mark-submission';
import { SubmissionFileDownload } from '@/features/submit-assignment';
import type { Assignment } from '@/entities/assignment';
import { useTerminology } from '@/entities/institution-configuration';
import { submissionQueries } from '@/entities/submission';
import {
  Badge,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
} from '@/shared/ui';

/** Every submission on the assignment, for whoever may propose a grade. */
export function OfferingMarking({
  institutionId,
  assignment,
}: {
  institutionId: string;
  assignment: Assignment;
}) {
  const t = useTranslations('marking');
  const term = useTerminology(institutionId);
  const format = useFormatter();
  const timeZone = useTimeZone() ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const submissions = useQuery(
    submissionQueries.forAssignment({
      path: { institutionId, assignmentId: assignment.id },
    }),
  );

  if (submissions.isPending)
    return <TableSkeleton rows={3} data-testid="offering-marking-loading" />;

  if (submissions.isError)
    return <p className="text-muted-foreground text-sm">{t('error')}</p>;

  if (submissions.data.length === 0)
    return <EmptyState size="inline" title={t('empty')} />;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">
        {t('handedInCount', { count: submissions.data.length })}
      </p>

      <Table label={t('tableLabel', { name: assignment.name })}>
        <TableHeader>
          <TableRow>
            <TableHead>{term('student')}</TableHead>
            <TableHead>{t('column.handedIn')}</TableHead>
            <TableHead>{t('column.files')}</TableHead>
            <TableHead>{t('column.mark')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.data.map(submission => (
            <TableRow key={submission.id}>
              <TableCell>
                {submission.student.displayName}
                <span className="text-muted-foreground block text-xs">
                  {t('attempt', { attempt: submission.attempt })}
                </span>
              </TableCell>
              <TableCell>
                {submission.submittedAt === null
                  ? t('notHandedIn')
                  : format.dateTime(new Date(submission.submittedAt), {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                      timeZone,
                    })}
                {submission.isLate ? (
                  <Badge variant="destructive" className="ml-2">
                    {t('late')}
                  </Badge>
                ) : null}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {submission.files.length === 0
                    ? t('noFiles')
                    : submission.files.map(file => (
                        <SubmissionFileDownload
                          key={file.id}
                          institutionId={institutionId}
                          assignmentId={assignment.id}
                          submissionId={submission.id}
                          fileId={file.id}
                          filename={file.filename}
                        />
                      ))}
                </div>
              </TableCell>
              <TableCell>
                <MarkSubmissionForm
                  institutionId={institutionId}
                  assignmentId={assignment.id}
                  submissionId={submission.id}
                  studentName={submission.student.displayName}
                  maxPoints={assignment.maxPoints}
                  mark={submission.mark}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
