'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTimeZone, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  AVAILABILITY_ORDER_ISSUE,
  AvailabilityFields,
  availabilityFormShape,
  availabilityInOrder,
  toAvailabilityPayload,
  toAvailabilityValues,
  type AvailabilityFormValues,
} from '@/entities/availability';
import {
  learningMaterialMutations,
  learningMaterialQueries,
  type LearningMaterial,
} from '@/entities/learning-material';
import { toApiError } from '@/shared/api';
import { DEFAULT_TIME_ZONE } from '@/shared/config';
import { useZodResolver } from '@/shared/lib';
import { Button, Form } from '@/shared/ui';

const availabilityFormSchema = z
  .object(availabilityFormShape)
  .refine(availabilityInOrder, AVAILABILITY_ORDER_ISSUE);

export function MaterialAvailabilityForm({
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
  const t = useTranslations('availability');
  const timeZone = useTimeZone() ?? DEFAULT_TIME_ZONE;
  const queryClient = useQueryClient();

  const form = useForm<AvailabilityFormValues>({
    resolver: useZodResolver(availabilityFormSchema),
    defaultValues: toAvailabilityValues(material, timeZone),
  });

  const update = useMutation({
    ...learningMaterialMutations.update(),
    onSuccess: async () => {
      toast.success(t('saved'));
      await queryClient.invalidateQueries({
        queryKey: learningMaterialQueries.listKey({ path: { institutionId, spaceId } }),
      });
      onDone();
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  const onSubmit = form.handleSubmit(values => {
    update.mutate({
      path: { institutionId, spaceId, materialId: material.id },
      body: toAvailabilityPayload(values, timeZone),
    });
  });

  return (
    <Form {...form} schema={availabilityFormSchema}>
      <form
        onSubmit={onSubmit}
        noValidate
        aria-label={t('editNamed', { title: material.title })}
        className="flex flex-col gap-4"
      >
        <AvailabilityFields />
        <Button
          type="submit"
          size="sm"
          className="self-start"
          disabled={update.isPending}
        >
          {update.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {t('save')}
        </Button>
      </form>
    </Form>
  );
}
