import { useTranslations } from 'next-intl';

import { RevokeRoleButton } from '@/features/revoke-role';
import type { RoleAssignment } from '@/entities/role-assignment';
import { Badge, TableCell, TableRow } from '@/shared/ui';

interface RoleAssignmentRowProps {
  assignment: RoleAssignment;
  institutionId: string;
}

export function RoleAssignmentRow({ assignment, institutionId }: RoleAssignmentRowProps) {
  const t = useTranslations('roleAdmin');
  const labels = useTranslations('roles');
  const roleLabel = labels(`role.${assignment.role}`);

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{assignment.userId}</TableCell>
      <TableCell label={t('role')}>{roleLabel}</TableCell>
      <TableCell label={t('scopeType')}>
        {labels(`scope.${assignment.scopeType}`)}
      </TableCell>
      <TableCell label={t('scopeId')} wide className="font-mono text-xs">
        {assignment.scopeId ?? '—'}
      </TableCell>
      <TableCell className="text-right">
        {assignment.revocable && assignment.id ? (
          <RevokeRoleButton
            institutionId={institutionId}
            assignmentId={assignment.id}
            roleLabel={roleLabel}
          />
        ) : (
          <Badge variant="secondary">{t('derived')}</Badge>
        )}
      </TableCell>
    </TableRow>
  );
}
