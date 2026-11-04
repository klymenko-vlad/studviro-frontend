'use client';

import { ArrowRight } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import type { Institution } from '@/entities/institution';
import { usePermissions } from '@/entities/permission';
import { byWidestScope, type RoleAssignment } from '@/entities/role-assignment';
import { institutionRoutes, Link } from '@/shared/config';
import { initials, toneStyle } from '@/shared/lib';
import { Badge, Button } from '@/shared/ui';

/**
 * One institution as a way in: the whole card opens its dashboard, the
 * person's roles there say what they will find, and the screens they reach
 * for most sit along the foot.
 */
export function InstitutionCard({
  institution,
  roles,
}: {
  institution: Institution;
  roles: RoleAssignment[];
}) {
  const t = useTranslations('account');
  const labels = useTranslations('roles');
  const format = useFormatter();
  const { can } = usePermissions(institution.id);
  const routes = institutionRoutes(institution.id);

  const shortcuts = [
    can('enrollment:read') && {
      href: routes.courses,
      label: t('institutions.myCourses'),
    },
    can('grade:read') && { href: routes.grades, label: t('institutions.myGrades') },
    can('role:assign') && {
      href: `${routes.people}?tab=roles`,
      label: t('institutions.manageRoles'),
    },
    can('institution:manage') && {
      href: routes.settings,
      label: t('institutions.manageSettings'),
    },
  ].filter(shortcut => shortcut !== false);

  return (
    <li className="card-interactive bg-card text-card-foreground relative flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          style={toneStyle(institution.code)}
          className="tone bg-tone-soft text-tone grid size-12 shrink-0 place-items-center rounded-lg text-sm font-semibold"
        >
          {initials(institution.name)}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Link href={routes.dashboard} className="stretched-link outline-none">
            <span className="type-section">{institution.name}</span>
          </Link>
          <span className="text-muted-foreground text-sm uppercase">
            {institution.code}
          </span>
        </div>

        <span
          aria-hidden
          className="text-muted-foreground hidden items-center gap-1 text-sm font-medium sm:flex"
        >
          {t('institutions.open')}
          <ArrowRight className="size-4" />
        </span>
      </div>

      {roles.length === 0 ? null : (
        <ul className="flex flex-wrap gap-1.5">
          {distinct([...roles].sort(byWidestScope)).map(role => (
            <li key={`${role.role}:${role.scopeType}:${role.scopeId ?? ''}`}>
              <Badge variant="secondary" className="gap-1">
                <span>{labels(`role.${role.role}`)}</span>
                {role.scopeType === 'institution' ? null : (
                  <>
                    <span aria-hidden>·</span>
                    <span className="font-normal">
                      {labels(`scope.${role.scopeType}`)}
                    </span>
                  </>
                )}
                {role.validUntil ? (
                  <>
                    <span aria-hidden>·</span>
                    <span className="font-normal">
                      {t('validUntil', {
                        date: format.dateTime(new Date(role.validUntil), {
                          dateStyle: 'medium',
                        }),
                      })}
                    </span>
                  </>
                ) : null}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      {shortcuts.length === 0 ? null : (
        <div className="relative z-10 -mx-2 -mb-2 flex flex-wrap gap-1">
          {shortcuts.map(shortcut => (
            <Button key={shortcut.href} asChild variant="ghost" size="sm">
              <Link href={shortcut.href}>{shortcut.label}</Link>
            </Button>
          ))}
        </div>
      )}
    </li>
  );
}

/** A role held twice — granted and also derived — is still one role to the person. */
function distinct(roles: RoleAssignment[]): RoleAssignment[] {
  const seen = new Set<string>();

  return roles.filter(role => {
    const key = `${role.role}:${role.scopeType}:${role.scopeId ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
