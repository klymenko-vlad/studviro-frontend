'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { orgUnitMutations, orgUnitQueries } from '@/entities/org-unit';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

export function RetireOrgUnitButton({
  institutionId,
  orgUnitId,
  orgUnitName,
}: {
  institutionId: string;
  orgUnitId: string;
  orgUnitName: string;
}) {
  const t = useTranslations('orgUnits');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...orgUnitMutations.remove(),
    onSuccess: async () => {
      toast.success(t('retired', { name: orgUnitName }));
      await queryClient.invalidateQueries({
        queryKey: orgUnitQueries.listForInstitutionKey({ path: { institutionId } }),
      });
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={mutation.isPending}
      aria-label={t('retireNamed', { name: orgUnitName })}
      onClick={() => {
        mutation.mutate({ path: { institutionId, id: orgUnitId } });
      }}
    >
      {mutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {t('retire')}
    </Button>
  );
}
