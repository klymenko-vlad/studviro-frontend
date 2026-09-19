'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  learningMaterialMutations,
  learningMaterialQueries,
  neighbour,
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
  materials,
}: {
  institutionId: string;
  spaceId: string;
  material: LearningMaterial;
  materials: readonly LearningMaterial[];
}) {
  const t = useTranslations('materials');
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

  const move = async (direction: -1 | 1) => {
    const other = neighbour(materials, material.id, direction);
    if (other === null) return;

    // Positions are plain numbers the server stores as given, so a move is a
    // swap of two of them rather than a reindex of the whole list.
    await update.mutateAsync({
      path: { institutionId, spaceId, materialId: material.id },
      body: { position: other.position },
    });
    await update.mutateAsync({
      path: { institutionId, spaceId, materialId: other.id },
      body: { position: material.position },
    });
    await refresh();
  };

  const busy = update.isPending || remove.isPending;

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy || neighbour(materials, material.id, -1) === null}
        aria-label={t('moveUpNamed', { title: material.title })}
        onClick={() => void move(-1)}
      >
        <ArrowUp className="size-4" aria-hidden />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy || neighbour(materials, material.id, 1) === null}
        aria-label={t('moveDownNamed', { title: material.title })}
        onClick={() => void move(1)}
      >
        <ArrowDown className="size-4" aria-hidden />
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
