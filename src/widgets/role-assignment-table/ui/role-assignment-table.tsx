'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { roleAssignmentQueries } from '@/entities/role-assignment';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Skeleton,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';

import { RoleAssignmentRow } from './role-assignment-row';

export function RoleAssignmentTable({ institutionId }: { institutionId: string }) {
  const t = useTranslations('roleAdmin');
  const { data, isPending, isError } = useQuery(
    roleAssignmentQueries.listForInstitution({ path: { institutionId } }),
  );

  if (isPending)
    return <Skeleton className="h-24 w-full" data-testid="role-table-loading" />;

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('errorTitle')}</AlertTitle>
        <AlertDescription>{t('errorDescription')}</AlertDescription>
      </Alert>
    );
  }

  if (data.length === 0)
    return <p className="text-muted-foreground text-sm">{t('empty')}</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('userId')}</TableHead>
          <TableHead>{t('role')}</TableHead>
          <TableHead>{t('scopeType')}</TableHead>
          <TableHead>{t('scopeId')}</TableHead>
          <TableHead className="sr-only">{t('actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(assignment => (
          <RoleAssignmentRow
            key={
              assignment.id ??
              `${assignment.role}-${assignment.scopeType}-${assignment.scopeId}`
            }
            assignment={assignment}
            institutionId={institutionId}
          />
        ))}
      </TableBody>
    </Table>
  );
}
