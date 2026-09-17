'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  reconciliationMutations,
  reconciliationQueries,
  type Discrepancy,
  type ReconciledDomain,
  type ReconciliationAction,
} from '@/entities/reconciliation';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

const ACTIONS: readonly ReconciliationAction[] = ['accept_source', 'keep_platform'];

export function ResolveDiscrepancyButtons({
  institutionId,
  domain,
  discrepancy,
  onResolved,
}: {
  institutionId: string;
  domain: ReconciledDomain;
  discrepancy: Discrepancy;
  onResolved?: () => void;
}) {
  const t = useTranslations('sync.reconciliation.resolve');
  const tSync = useTranslations('sync');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...reconciliationMutations.resolve(),
    onSuccess: async resolution => {
      // The run that applies an accepted source must be a run against the system
      // that owns the row, so the toast names which one.
      toast.success(
        resolution.requiresFullSync
          ? t('resolvedNeedsRun', {
              system: tSync(`source.${resolution.sourceSystem}`),
            })
          : t('resolved'),
      );
      await queryClient.invalidateQueries({
        queryKey: reconciliationQueries.resolutionsKey({ path: { institutionId } }),
      });
      onResolved?.();
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  return (
    <div className="flex gap-2 whitespace-nowrap">
      {ACTIONS.map(action => (
        <Button
          key={action}
          type="button"
          size="sm"
          variant={action === 'accept_source' ? 'default' : 'outline'}
          disabled={mutation.isPending}
          onClick={() => {
            mutation.mutate({
              path: { institutionId },
              body: {
                domain,
                kind: discrepancy.kind,
                action,
                canonicalId: discrepancy.canonicalId,
                externalId: discrepancy.externalId,
              },
            });
          }}
        >
          {mutation.isPending && mutation.variables.body.action === action ? (
            <LoaderCircle className="animate-spin" aria-hidden />
          ) : null}
          {t(`action.${action}`)}
        </Button>
      ))}
    </div>
  );
}
