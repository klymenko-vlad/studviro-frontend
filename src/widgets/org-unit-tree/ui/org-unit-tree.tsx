'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { orgUnitQueries, toTree } from '@/entities/org-unit';
import { Alert, AlertDescription, AlertTitle, Skeleton } from '@/shared/ui';

import { OrgUnitTreeNode } from './org-unit-tree-node';

export function OrgUnitTree({ institutionId }: { institutionId: string }) {
  const t = useTranslations('orgUnits');
  const { data, isPending, isError } = useQuery(
    orgUnitQueries.listForInstitution({ path: { institutionId } }),
  );

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

  if (data.length === 0)
    return <p className="text-muted-foreground text-sm">{t('empty')}</p>;

  const roots = toTree(data);

  return (
    <ul aria-label={t('treeLabel')}>
      {roots.map(node => (
        <OrgUnitTreeNode key={node.id} node={node} />
      ))}
    </ul>
  );
}
