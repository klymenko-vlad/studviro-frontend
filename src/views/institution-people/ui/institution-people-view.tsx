'use client';

import { useTranslations } from 'next-intl';

import { PageTabs, type PageTab } from '@/widgets/page-tabs';
import { PersonDirectoryTable } from '@/widgets/person-directory-table';
import { RoleAssignmentTable } from '@/widgets/role-assignment-table';
import { GrantRoleForm } from '@/features/grant-role';
import { InvitePersonForm } from '@/features/invite-person';
import { usePermissions } from '@/entities/permission';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
  PageShell,
} from '@/shared/ui';

/**
 * Everyone in the institution and what they may do: the directory, bringing
 * someone new in, and the roles that give access. Inviting used to live under
 * Roles, away from the people it is about.
 */
export function InstitutionPeopleView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('hubs.people');
  const roles = useTranslations('roleAdmin');
  const { can, isPending } = usePermissions(institutionId);
  const mayAssign = can('role:assign');

  const tabs: PageTab<'directory' | 'invite' | 'roles'>[] = [
    {
      key: 'directory',
      label: t('tabs.directory'),
      content: (
        <Card>
          <CardContent>
            <PersonDirectoryTable institutionId={institutionId} />
          </CardContent>
        </Card>
      ),
    },
    ...(mayAssign
      ? [
          {
            key: 'invite' as const,
            label: t('tabs.invite'),
            content: (
              <Card>
                <CardHeader>
                  <CardTitle>{roles('inviteTitle')}</CardTitle>
                  <CardDescription>{roles('inviteDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <InvitePersonForm institutionId={institutionId} />
                </CardContent>
              </Card>
            ),
          },
          {
            key: 'roles' as const,
            label: t('tabs.roles'),
            content: (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>{roles('assigned')}</CardTitle>
                    <CardDescription>{roles('assignedDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RoleAssignmentTable institutionId={institutionId} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>{roles('grantTitle')}</CardTitle>
                    <CardDescription>{roles('grantDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GrantRoleForm institutionId={institutionId} />
                  </CardContent>
                </Card>
              </>
            ),
          },
        ]
      : []),
  ];

  return (
    <PageShell width="detail">
      <PageHeader title={t('title')} description={t('subtitle')} />
      {isPending ? null : <PageTabs tabs={tabs} label={t('title')} />}
    </PageShell>
  );
}
