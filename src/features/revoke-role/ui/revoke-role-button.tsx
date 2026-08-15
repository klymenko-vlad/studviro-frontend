'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  roleAssignmentMutations,
  roleAssignmentQueries,
} from '@/entities/role-assignment';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

interface RevokeRoleButtonProps {
  institutionId: string;
  assignmentId: string;
  roleLabel: string;
}

export function RevokeRoleButton({
  institutionId,
  assignmentId,
  roleLabel,
}: RevokeRoleButtonProps) {
  const t = useTranslations('roleAdmin');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...roleAssignmentMutations.revoke(),
    onSuccess: async () => {
      toast.success(t('revoked'));
      await queryClient.invalidateQueries({
        queryKey: roleAssignmentQueries.listForInstitutionKey({
          path: { institutionId },
        }),
      });
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={t('revokeLabel', { role: roleLabel })}
      disabled={mutation.isPending}
      onClick={() => {
        mutation.mutate({ path: { institutionId, id: assignmentId } });
      }}
    >
      {t('revoke')}
    </Button>
  );
}
