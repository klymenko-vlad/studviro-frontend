'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { GradeEntryCell } from '@/features/record-grade';
import {
  currentAttempt,
  offeringResultQueries,
  standingGrade,
  type OfferingResultStudent,
} from '@/entities/offering-result';
import {
  Badge,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';

export function OfferingGrades({
  institutionId,
  offeringId,
}: {
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('gradeEntry');
  const results = useQuery(
    offeringResultQueries.list({ path: { institutionId, offeringId } }),
  );

  if (results.isPending)
    return <Skeleton className="h-48 w-full" data-testid="offering-grades-loading" />;

  if (results.isError)
    return <p className="text-muted-foreground text-sm">{t('error')}</p>;

  if (results.data.students.length === 0)
    return <p className="text-muted-foreground text-sm">{t('empty')}</p>;

  return (
    <div className="flex flex-col gap-3" data-testid="offering-grades">
      <p className="text-muted-foreground text-sm">
        {results.data.canPublish ? t('mayPublish') : t('mayOnlyPropose')}
      </p>

      <Table label={t('panelTitle')}>
        <TableHeader>
          <TableRow>
            <TableHead>{t('column.student')}</TableHead>
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

      <TableCell>
        {attempt === null
          ? t('attemptNone')
          : t('attemptNumber', { attempt: attempt.attempt })}
      </TableCell>

      <TableCell className="flex flex-wrap items-center gap-2">
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

      <TableCell>
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
