import { useFormatter, useTranslations } from 'next-intl';

import type { RoleAssignment } from '@/entities/role-assignment';
import { Badge } from '@/shared/ui';

export function RoleAssignmentItem({ assignment }: { assignment: RoleAssignment }) {
  const t = useTranslations('account');
  const format = useFormatter();

  const until = assignment.validUntil
    ? t('validUntil', {
        date: format.dateTime(new Date(assignment.validUntil), { dateStyle: 'medium' }),
      })
    : undefined;

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div className="flex flex-col gap-1">
        <span className="font-medium">{t(`role.${assignment.role}`)}</span>
        {until ? <span className="text-muted-foreground text-sm">{until}</span> : null}
      </div>

      <Badge variant="secondary">{t(`scope.${assignment.scopeType}`)}</Badge>
    </li>
  );
}
