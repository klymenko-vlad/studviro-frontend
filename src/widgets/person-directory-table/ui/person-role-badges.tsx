import { useTranslations } from 'next-intl';

import type { Person } from '@/entities/person';
import { Badge } from '@/shared/ui';

export function PersonRoleBadges({ roles }: { roles: Person['roles'] }) {
  const labels = useTranslations('roles');
  const t = useTranslations('people');

  if (roles.length === 0) {
    return <span className="text-muted-foreground text-sm">{t('noRoles')}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role, index) => (
        <Badge
          key={`${role.role}-${role.scopeType}-${role.scopeId}-${index}`}
          variant={role.source === 'derived' ? 'secondary' : 'default'}
        >
          {labels(`role.${role.role}`)}
        </Badge>
      ))}
    </div>
  );
}
