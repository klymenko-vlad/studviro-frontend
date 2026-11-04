'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  learningMaterialMutations,
  learningMaterialQueries,
  type LearningMaterial,
} from '@/entities/learning-material';
import { toApiError } from '@/shared/api';
import { useZodResolver } from '@/shared/lib';
import { Button, Form, ListSkeleton } from '@/shared/ui';

import {
  materialEditSchema,
  toMaterialEdit,
  type MaterialEditValues,
} from '../model/schema';
import { MaterialContentFields } from './material-content-fields';

export function MaterialEditForm({
  institutionId,
  spaceId,
  material,
  onDone,
}: {
  institutionId: string;
  spaceId: string;
  material: LearningMaterial;
  onDone: () => void;
}) {
  const t = useTranslations('materials');
  const path = { institutionId, spaceId, materialId: material.id };
  const whole = useQuery({
    ...learningMaterialQueries.detail({ path }),
    enabled: material.kind === 'page',
  });

  if (material.kind === 'page' && whole.data === undefined) {
    return whole.isError ? (
      <p role="alert" className="text-destructive text-sm">
        {t('edit.loadError')}
      </p>
    ) : (
      <ListSkeleton items={1} />
    );
  }

  return (
    <EditContent
      institutionId={institutionId}
      spaceId={spaceId}
      material={whole.data ?? material}
      onDone={onDone}
    />
  );
}

function EditContent({
  institutionId,
  spaceId,
  material,
  onDone,
}: {
  institutionId: string;
  spaceId: string;
  material: LearningMaterial;
  onDone: () => void;
}) {
  const t = useTranslations('materials');
  const queryClient = useQueryClient();
  const schema = materialEditSchema(material.kind);
  const form = useForm<MaterialEditValues>({
    resolver: useZodResolver(schema),
    defaultValues: {
      title: material.title,
      body: material.body ?? '',
      url: material.url ?? '',
    },
  });

  const update = useMutation({
    ...learningMaterialMutations.update(),
    onSuccess: async () => {
      toast.success(t('edit.saved'));
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: learningMaterialQueries.listKey({ path: { institutionId, spaceId } }),
        }),
        queryClient.invalidateQueries({
          queryKey: learningMaterialQueries.detailKey({
            path: { institutionId, spaceId, materialId: material.id },
          }),
        }),
      ]);
      onDone();
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  const onSubmit = form.handleSubmit(values => {
    update.mutate({
      path: { institutionId, spaceId, materialId: material.id },
      body: toMaterialEdit(material.kind, values),
    });
  });

  return (
    <Form {...form} schema={schema}>
      <form
        onSubmit={onSubmit}
        noValidate
        aria-label={t('edit.formNamed', { title: material.title })}
        className="flex flex-col gap-4"
      >
        <MaterialContentFields kind={material.kind} control={form.control} />
        <Button
          type="submit"
          size="sm"
          className="self-start"
          disabled={update.isPending}
        >
          {update.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {t('edit.save')}
        </Button>
      </form>
    </Form>
  );
}
