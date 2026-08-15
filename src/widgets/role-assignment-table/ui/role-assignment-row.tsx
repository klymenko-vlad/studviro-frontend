import { useTranslations } from 'next-intl';

import { RevokeRoleButton } from '@/features/revoke-role';
import type { RoleAssignment } from '@/entities/role-assignment';
import { TableCell, TableRow } from '@/shared/ui';

interface RoleAssignmentRowProps {
  assignment: RoleAssignment;
  institutionId: string;
}

export function RoleAssignmentRow({ assignment, institutionId }: RoleAssignmentRowProps) {
  const labels = useTranslations('roles');
  const roleLabel = labels(`role.${assignment.role}`);

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{assignment.userId}</TableCell>
      <TableCell>{roleLabel}</TableCell>
      <TableCell>{labels(`scope.${assignment.scopeType}`)}</TableCell>
      <TableCell className="font-mono text-xs">{assignment.scopeId ?? '—'}</TableCell>
      <TableCell className="text-right">
        <RevokeRoleButton
          institutionId={institutionId}
          assignmentId={assignment.id}
          roleLabel={roleLabel}
        />
      </TableCell>
    </TableRow>
  );
}
