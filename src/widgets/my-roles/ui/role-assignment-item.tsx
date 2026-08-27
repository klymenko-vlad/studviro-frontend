import { useFormatter, useTranslations } from 'next-intl';

import type { RoleAssignment } from '@/entities/role-assignment';
import { Badge } from '@/shared/ui';

interface RoleAssignmentItemProps {
  assignment: RoleAssignment;
  institutionName?: string | undefined;
}

export function RoleAssignmentItem({
  assignment,
  institutionName,
}: RoleAssignmentItemProps) {
  const t = useTranslations('account');
  const labels = useTranslations('roles');
  const format = useFormatter();

  const until = assignment.validUntil
    ? t('validUntil', {
        date: format.dateTime(new Date(assignment.validUntil), { dateStyle: 'medium' }),
      })
    : undefined;

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div className="flex flex-col gap-1">
        <span className="font-medium">{labels(`role.${assignment.role}`)}</span>
        {institutionName ? (
          <span className="text-muted-foreground text-sm">{institutionName}</span>
        ) : null}
        {until ? <span className="text-muted-foreground text-sm">{until}</span> : null}
      </div>

      <Badge variant="secondary">{labels(`scope.${assignment.scopeType}`)}</Badge>
    </li>
  );
}
