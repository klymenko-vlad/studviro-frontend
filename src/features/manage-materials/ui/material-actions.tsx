'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  learningMaterialMutations,
  learningMaterialQueries,
  type LearningMaterial,
} from '@/entities/learning-material';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

function useMaterialList(institutionId: string, spaceId: string) {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: learningMaterialQueries.listKey({ path: { institutionId, spaceId } }),
    });
  };
}

export function MaterialActions({
  institutionId,
  spaceId,
  material,
  scheduling,
  onSchedule,
}: {
  institutionId: string;
  spaceId: string;
  material: LearningMaterial;
  scheduling: boolean;
  onSchedule: () => void;
}) {
  const t = useTranslations('materials');
  const tAvailability = useTranslations('availability');
  const refresh = useMaterialList(institutionId, spaceId);

  const update = useMutation({
    ...learningMaterialMutations.update(),
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  const remove = useMutation({
    ...learningMaterialMutations.remove(),
    onSuccess: async () => {
      toast.success(t('removed', { title: material.title }));
      await refresh();
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
        aria-expanded={scheduling}
        aria-label={tAvailability('editNamed', { title: material.title })}
        onClick={onSchedule}
      >
        {tAvailability('edit')}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy}
        aria-label={
          material.visible
            ? t('hideNamed', { title: material.title })
            : t('showNamed', { title: material.title })
        }
        onClick={() => {
          update.mutate(
            {
              path: { institutionId, spaceId, materialId: material.id },
              body: { visible: !material.visible },
            },
            { onSuccess: () => void refresh() },
          );
        }}
      >
        {material.visible ? t('hide') : t('show')}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy}
        aria-label={t('removeNamed', { title: material.title })}
        onClick={() => {
          remove.mutate({ path: { institutionId, spaceId, materialId: material.id } });
        }}
      >
        {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {t('remove')}
      </Button>
    </div>
  );
}
