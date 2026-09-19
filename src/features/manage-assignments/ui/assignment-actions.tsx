'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  assignmentMutations,
  assignmentQueries,
  type Assignment,
} from '@/entities/assignment';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

export function AssignmentActions({
  institutionId,
  spaceId,
  assignment,
}: {
  institutionId: string;
  spaceId: string;
  assignment: Assignment;
}) {
  const t = useTranslations('assignments');
  const queryClient = useQueryClient();

  const settle = async () => {
    await queryClient.invalidateQueries({
      queryKey: assignmentQueries.listKey({ path: { institutionId, spaceId } }),
    });
  };

  const update = useMutation({
    ...assignmentMutations.update(),
    onSuccess: settle,
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  const remove = useMutation({
    ...assignmentMutations.remove(),
    onSuccess: async () => {
      toast.success(t('removed', { name: assignment.name }));
      await settle();
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  const busy = update.isPending || remove.isPending;

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy}
        aria-label={
          assignment.visible
            ? t('hideNamed', { name: assignment.name })
            : t('showNamed', { name: assignment.name })
        }
        onClick={() => {
          update.mutate({
            path: { institutionId, spaceId, assignmentId: assignment.id },
            body: { visible: !assignment.visible },
          });
        }}
      >
        {assignment.visible ? t('hide') : t('show')}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy}
        aria-label={t('removeNamed', { name: assignment.name })}
        onClick={() => {
          remove.mutate({
            path: { institutionId, spaceId, assignmentId: assignment.id },
          });
        }}
      >
        {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {t('remove')}
      </Button>
    </div>
  );
}
