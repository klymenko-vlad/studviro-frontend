'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { roleAssignmentQueries } from '@/entities/role-assignment';
import {
  EmptyState,
  QueryError,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
} from '@/shared/ui';

import { RoleAssignmentRow } from './role-assignment-row';

export function RoleAssignmentTable({ institutionId }: { institutionId: string }) {
  const t = useTranslations('roleAdmin');
  const { data, isPending, isError, refetch } = useQuery(
    roleAssignmentQueries.listForInstitution({ path: { institutionId } }),
  );

  if (isPending) return <TableSkeleton rows={4} data-testid="role-table-loading" />;

  if (isError) {
    return (
      <QueryError
        onRetry={refetch}
        title={t('errorTitle')}
        description={t('errorDescription')}
      />
    );
  }

  if (data.length === 0) return <EmptyState size="inline" title={t('empty')} />;

  return (
    <Table label={t('tableLabel')}>
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
