'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';

import {
  AdmitStudentForm,
  MembershipStatusSelect,
} from '@/features/manage-program-members';
import { useTerminology } from '@/entities/institution-configuration';
import { usePermissions } from '@/entities/permission';
import {
  byStanding,
  countStudying,
  programMemberQueries,
} from '@/entities/program-member';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
} from '@/shared/ui';

export function ProgramMembers({
  institutionId,
  programId,
}: {
  institutionId: string;
  programId: string;
}) {
  const t = useTranslations('programMembers');
  const term = useTerminology(institutionId);
  const format = useFormatter();
  const { can } = usePermissions(institutionId);
  const manageable = can('program:manage');
  const readable = can('role:read');

  const members = useQuery({
    ...programMemberQueries.list({ path: { institutionId, programId } }),
    enabled: readable,
  });

  if (!readable) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {members.isSuccess
            ? t('studying', { count: countStudying(members.data) })
            : t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {manageable ? (
          <AdmitStudentForm institutionId={institutionId} programId={programId} />
        ) : null}

        {members.isPending ? (
          <TableSkeleton rows={4} data-testid="program-members-loading" />
        ) : members.isError ? (
          <p className="text-muted-foreground text-sm">{t('error')}</p>
        ) : members.data.length === 0 ? (
          <EmptyState size="inline" title={t('empty')} />
        ) : (
          <Table label={t('title')} data-testid="program-members-table">
            <TableHeader>
              <TableRow>
                <TableHead>{term('student')}</TableHead>
                <TableHead>{t('column.year')}</TableHead>
                <TableHead>{t('column.since')}</TableHead>
                <TableHead>{t('column.standing')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byStanding(members.data).map(member => (
                <TableRow key={member.id}>
                  <TableCell>
                    <span className="font-medium">{member.displayName}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {member.email}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {member.studyYear === null
                      ? '—'
                      : t('yearNumber', { year: member.studyYear })}
                  </TableCell>
                  <TableCell className="text-sm">
                    {member.startedAt === null
                      ? '—'
                      : format.dateTime(new Date(member.startedAt), {
                          dateStyle: 'medium',
                        })}
                  </TableCell>
                  <TableCell>
                    {manageable ? (
                      <MembershipStatusSelect
                        institutionId={institutionId}
                        programId={programId}
                        member={member}
                      />
                    ) : (
                      <Badge
                        variant={member.status === 'active' ? 'default' : 'secondary'}
                      >
                        {t(`status.${member.status}`)}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
