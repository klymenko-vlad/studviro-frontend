'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import {
  dashboardSections,
  InstitutionDashboard,
  TermToday,
} from '@/widgets/institution-dashboard';
import { institutionQueries } from '@/entities/institution';
import { usePermissions } from '@/entities/permission';
import { useSession } from '@/entities/session';
import { Badge, ListSkeleton, PageHeader, PageShell } from '@/shared/ui';

export function InstitutionDashboardView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('dashboard');
  const tRoles = useTranslations('roles.role');
  const user = useSession();
  const { roles, isPending } = usePermissions(institutionId);
  const institution = useQuery(institutionQueries.detail({ path: { institutionId } }));

  const held = [...new Set(roles)];
  const sections = dashboardSections(held);
  const lead = sections[0];
  const firstName = user?.displayName.trim().split(/\s+/)[0] ?? '';

  return (
    <PageShell>
      <PageHeader
        eyebrow={institution.data?.name}
        title={
          firstName === '' ? t('greetingAnonymous') : t('greeting', { name: firstName })
        }
        description={
          isPending
            ? undefined
            : t(lead === undefined ? 'subtitle' : `sections.${lead}.subtitle`)
        }
      >
        <TermToday institutionId={institutionId} />
        {held.length < 2 ? null : (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t('rolesLabel')}</span>
            <ul className="flex flex-wrap gap-1.5">
              {held.map(role => (
                <li key={role}>
                  <Badge variant="secondary">{tRoles(role)}</Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </PageHeader>

      {isPending ? (
        <ListSkeleton items={4} data-testid="dashboard-loading" />
      ) : (
        <InstitutionDashboard institutionId={institutionId} sections={sections} />
      )}
    </PageShell>
  );
}
