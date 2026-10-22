'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { institutionName, institutionQueries } from '@/entities/institution';
import { byWidestScope, roleAssignmentQueries } from '@/entities/role-assignment';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ListSkeleton,
} from '@/shared/ui';

import { RoleAssignmentItem } from './role-assignment-item';

export function MyRoles() {
  const t = useTranslations('account');
  const { data, isPending, isError } = useQuery(roleAssignmentQueries.mine());
  const { data: institutions } = useQuery(institutionQueries.mine());

  const assignments = [...(data ?? [])].sort(byWidestScope);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('roles.title')}</CardTitle>
        <CardDescription>{t('roles.description')}</CardDescription>
      </CardHeader>

      <CardContent>
        {isPending ? <ListSkeleton items={2} data-testid="my-roles-loading" /> : null}

        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>{t('roles.errorTitle')}</AlertTitle>
            <AlertDescription>{t('roles.errorDescription')}</AlertDescription>
          </Alert>
        ) : null}

        {!isPending && !isError && assignments.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('roles.empty')}</p>
        ) : null}

        {assignments.length > 0 ? (
          <ul className="divide-border divide-y">
            {assignments.map(assignment => (
              <RoleAssignmentItem
                key={
                  assignment.id ??
                  `${assignment.source}:${assignment.institutionId}:${assignment.role}:${assignment.scopeType}:${assignment.scopeId ?? ''}`
                }
                assignment={assignment}
                institutionName={institutionName(
                  institutions ?? [],
                  assignment.institutionId,
                )}
              />
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
