'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  teachingAssignmentMutations,
  teachingAssignmentQueries,
} from '@/entities/teaching-assignment';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

export function UnassignTeacherButton({
  institutionId,
  offeringId,
  assignmentId,
  displayName,
}: {
  institutionId: string;
  offeringId: string;
  assignmentId: string;
  displayName: string;
}) {
  const t = useTranslations('teaching');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...teachingAssignmentMutations.unassign(),
    onSuccess: async () => {
      toast.success(t('unassigned', { name: displayName }));
      await queryClient.invalidateQueries({
        queryKey: teachingAssignmentQueries.listKey({
          path: { institutionId, offeringId },
        }),
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
      aria-label={t('unassignNamed', { name: displayName })}
      onClick={() => {
        mutation.mutate({ path: { institutionId, offeringId, assignmentId } });
      }}
    >
      {mutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {t('unassign')}
    </Button>
  );
}
