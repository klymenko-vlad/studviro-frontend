'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { GradeEntryCell } from '@/features/record-grade';
import { useTerminology } from '@/entities/institution-configuration';
import {
  currentAttempt,
  offeringResultQueries,
  standingGrade,
  type OfferingResultStudent,
} from '@/entities/offering-result';
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

export function OfferingGrades({
  institutionId,
  offeringId,
}: {
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('gradeEntry');
  const term = useTerminology(institutionId);
  const results = useQuery(
    offeringResultQueries.list({ path: { institutionId, offeringId } }),
  );

  if (results.isPending)
    return <TableSkeleton rows={4} data-testid="offering-grades-loading" />;

  if (results.isError)
    return <p className="text-muted-foreground text-sm">{t('error')}</p>;

  if (results.data.students.length === 0)
    return <EmptyState size="inline" title={t('empty')} />;

  return (
    <div className="flex flex-col gap-3" data-testid="offering-grades">
      <p className="text-muted-foreground text-sm">
        {results.data.canPublish ? t('mayPublish') : t('mayOnlyPropose')}
      </p>

      <Table label={t('panelTitle')}>
        <TableHeader>
          <TableRow>
            <TableHead>{term('student')}</TableHead>
            <TableHead>{t('column.attempt')}</TableHead>
            <TableHead>{t('column.standing')}</TableHead>
            <TableHead>{t('column.record')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.data.students.map(student => (
            <StudentRow
              key={student.enrollmentId}
              institutionId={institutionId}
              offeringId={offeringId}
              student={student}
              canPublish={results.data.canPublish}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function StudentRow({
  institutionId,
  offeringId,
  student,
  canPublish,
}: {
  institutionId: string;
  offeringId: string;
  student: OfferingResultStudent;
  canPublish: boolean;
}) {
  const t = useTranslations('gradeEntry');
  const attempt = currentAttempt(student);
  const standing = standingGrade(attempt);

  return (
    <TableRow>
      <TableCell className="font-medium">
        {student.displayName}
        <span className="text-muted-foreground block text-xs">{student.email}</span>
      </TableCell>

      <TableCell label={t('column.attempt')}>
        {attempt === null
          ? t('attemptNone')
          : t('attemptNumber', { attempt: attempt.attempt })}
      </TableCell>

      <TableCell label={t('column.standing')}>
        {attempt?.isVoided ? (
          <Badge variant="destructive">{t('annulled')}</Badge>
        ) : standing === null ? (
          <span className="text-muted-foreground text-sm">{t('notGraded')}</span>
        ) : (
          <Badge variant={attempt?.official.grade === null ? 'secondary' : 'default'}>
            {t(`grade.${standing}`)}
          </Badge>
        )}
      </TableCell>

      <TableCell label={t('column.record')} wide>
        <GradeEntryCell
          institutionId={institutionId}
          offeringId={offeringId}
          student={student}
          canPublish={canPublish}
        />
      </TableCell>
    </TableRow>
  );
}
