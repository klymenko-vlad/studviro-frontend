import { useFormatter, useTranslations } from 'next-intl';

import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';

import type { RosterStudent } from '../model/course-roster';

const STATUS_VARIANT = {
  active: 'success',
  completed: 'secondary',
  requested: 'warning',
  provisioning: 'warning',
  withdrawn: 'secondary',
  rejected: 'destructive',
  waitlisted: 'warning',
} as const;

export function RosterTable({
  students,
  caption,
}: {
  students: RosterStudent[];
  caption: string;
}) {
  const t = useTranslations('roster');
  const format = useFormatter();

  return (
    <Table label={caption}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('column.student')}</TableHead>
          <TableHead>{t('column.status')}</TableHead>
          <TableHead>{t('column.studyGroups')}</TableHead>
          <TableHead>{t('column.enrolledAt')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map(student => (
          <TableRow key={student.enrollmentId}>
            <TableCell>
              <span className="font-medium">{student.displayName}</span>
              <span className="text-muted-foreground block text-xs">{student.email}</span>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_VARIANT[student.status]}>
                  {t(`status.${student.status}`)}
                </Badge>
                {student.attempt > 1 ? (
                  <Badge variant="outline">
                    {t('attempt', { attempt: student.attempt })}
                  </Badge>
                ) : null}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {student.studyGroups.length === 0
                ? t('noStudyGroups')
                : student.studyGroups.map(group => group.code).join(', ')}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {student.enrolledAt === null
                ? t('notEnrolledYet')
                : format.dateTime(new Date(student.enrolledAt), { dateStyle: 'medium' })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
