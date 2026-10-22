'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  offeringAdminMutations,
  offeringAdminQueries,
} from '@/entities/course-offering-admin';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

export function RetireOfferingButton({
  institutionId,
  offeringId,
  label,
}: {
  institutionId: string;
  offeringId: string;
  label: string;
}) {
  const t = useTranslations('offerings');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...offeringAdminMutations.remove(),
    onSuccess: async () => {
      toast.success(t('retired', { label }));
      await queryClient.invalidateQueries({
        queryKey: offeringAdminQueries.listKey({ path: { institutionId } }),
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
      aria-label={t('retireNamed', { label })}
      onClick={() => {
        mutation.mutate({ path: { institutionId, offeringId } });
      }}
    >
      {mutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {t('retire')}
    </Button>
  );
}
