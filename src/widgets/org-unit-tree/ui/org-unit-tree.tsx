'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { OrgUnitForm } from '@/features/manage-org-units';
import { orgUnitQueries, toTree } from '@/entities/org-unit';
import { usePermissions } from '@/entities/permission';
import { Alert, AlertDescription, AlertTitle, Skeleton } from '@/shared/ui';

import { OrgUnitTreeNode } from './org-unit-tree-node';

export function OrgUnitTree({ institutionId }: { institutionId: string }) {
  const t = useTranslations('orgUnits');
  const { can } = usePermissions(institutionId);
  const { data, isPending, isError } = useQuery(
    orgUnitQueries.listForInstitution({ path: { institutionId } }),
  );

  const form = can('institution:manage') ? (
    <OrgUnitForm institutionId={institutionId} />
  ) : null;

  if (isPending)
    return <Skeleton className="h-24 w-full" data-testid="org-unit-tree-loading" />;

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('errorTitle')}</AlertTitle>
        <AlertDescription>{t('errorDescription')}</AlertDescription>
      </Alert>
    );
  }

  const roots = toTree(data);

  return (
    <div className="flex flex-col gap-6">
      {form}

      {data.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('empty')}</p>
      ) : (
        <ul aria-label={t('treeLabel')}>
          {roots.map(node => (
            <OrgUnitTreeNode key={node.id} node={node} institutionId={institutionId} />
          ))}
        </ul>
      )}
    </div>
  );
}
