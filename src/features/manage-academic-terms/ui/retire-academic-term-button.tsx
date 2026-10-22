'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { academicTermMutations, academicTermQueries } from '@/entities/academic-term';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

export function RetireAcademicTermButton({
  institutionId,
  termId,
  termName,
}: {
  institutionId: string;
  termId: string;
  termName: string;
}) {
  const t = useTranslations('academicTerms');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...academicTermMutations.remove(),
    onSuccess: async () => {
      toast.success(t('retired', { name: termName }));
      await queryClient.invalidateQueries({
        queryKey: academicTermQueries.listKey({ path: { institutionId } }),
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
      aria-label={t('retireNamed', { name: termName })}
      onClick={() => {
        mutation.mutate({ path: { institutionId, id: termId } });
      }}
    >
      {mutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {t('retire')}
    </Button>
  );
}
