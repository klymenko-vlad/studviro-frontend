'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { institutionQueries } from '@/entities/institution';
import { roleAssignmentQueries, type RoleAssignment } from '@/entities/role-assignment';
import { EmptyState, ListSkeleton } from '@/shared/ui';

import { InstitutionCard } from './institution-card';

export function MyInstitutions() {
  const t = useTranslations('account');
  const { data, isPending } = useQuery(institutionQueries.mine());
  const roles = useQuery(roleAssignmentQueries.mine());

  const institutions = data ?? [];
  const rolesIn = (institutionId: string): RoleAssignment[] =>
    (roles.data ?? []).filter(role => role.institutionId === institutionId);

  return (
    <section aria-labelledby="my-institutions" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="my-institutions" className="type-section">
          {t('institutions.title')}
        </h2>
        <p className="text-muted-foreground text-sm">{t('institutions.description')}</p>
      </div>

      {isPending ? (
        <ListSkeleton items={1} data-testid="my-institutions-loading" />
      ) : institutions.length === 0 ? (
        <EmptyState
          icon={<Building2 aria-hidden />}
          title={t('institutions.empty')}
          description={t('institutions.emptyDescription')}
        />
      ) : (
        <ul className="stagger flex flex-col gap-4">
          {institutions.map(institution => (
            <InstitutionCard
              key={institution.id}
              institution={institution}
              roles={rolesIn(institution.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
