'use client';

import { useId } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { MATERIAL_COMPLETION_RULES } from '@/entities/completion';
import {
  learningMaterialMutations,
  learningMaterialQueries,
  type LearningMaterial,
} from '@/entities/learning-material';
import { toApiError } from '@/shared/api';
import { Label, Select, SelectItem } from '@/shared/ui';

export function MaterialCompletionSelect({
  institutionId,
  spaceId,
  material,
}: {
  institutionId: string;
  spaceId: string;
  material: LearningMaterial;
}) {
  const t = useTranslations('completion');
  const id = useId();
  const queryClient = useQueryClient();

  const update = useMutation({
    ...learningMaterialMutations.update(),
    onSuccess: async () => {
      toast.success(t('saved'));
      await queryClient.invalidateQueries({
        queryKey: learningMaterialQueries.listKey({ path: { institutionId, spaceId } }),
      });
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Label htmlFor={id} className="text-muted-foreground font-normal">
        {t('field.rule')}
      </Label>
      <Select
        id={id}
        uiSize="sm"
        aria-label={t('ruleOfNamed', { title: material.title })}
        value={material.completionRule}
        disabled={update.isPending}
        onValueChange={value => {
          update.mutate({
            path: { institutionId, spaceId, materialId: material.id },
            body: { completionRule: value as (typeof MATERIAL_COMPLETION_RULES)[number] },
          });
        }}
      >
        {MATERIAL_COMPLETION_RULES.map(rule => (
          <SelectItem key={rule} value={rule}>
            {t(`rule.${rule}`)}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}
