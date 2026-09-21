'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { RoleAssignmentTable } from '@/widgets/role-assignment-table';
import { GrantRoleForm } from '@/features/grant-role';
import { InvitePersonForm } from '@/features/invite-person';
import { institutionQueries } from '@/entities/institution';
import { usePermissions } from '@/entities/permission';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
  PageShell,
} from '@/shared/ui';

export function InstitutionRolesView({ institutionId }: { institutionId: string }) {
  const t = useTranslations('roleAdmin');
  const { data: institution } = useQuery(
    institutionQueries.detail({ path: { institutionId } }),
  );
  const { can, isPending } = usePermissions(institutionId);
  const mayAssign = can('role:assign');

  return (
    <PageShell width="detail">
      <PageHeader
        title={t('title')}
        description={institution ? institution.name : t('subtitle')}
      />

      {!isPending && !mayAssign ? (
        <Alert>
          <AlertTitle>{t('deniedTitle')}</AlertTitle>
          <AlertDescription>{t('deniedDescription')}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t('assigned')}</CardTitle>
          <CardDescription>{t('assignedDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <RoleAssignmentTable institutionId={institutionId} />
        </CardContent>
      </Card>

      {mayAssign ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('grantTitle')}</CardTitle>
            <CardDescription>{t('grantDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <GrantRoleForm institutionId={institutionId} />
          </CardContent>
        </Card>
      ) : null}

      {mayAssign ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('inviteTitle')}</CardTitle>
            <CardDescription>{t('inviteDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <InvitePersonForm institutionId={institutionId} />
          </CardContent>
        </Card>
      ) : null}
    </PageShell>
  );
}
