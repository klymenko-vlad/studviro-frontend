import { z } from 'zod';

import {
  AVAILABILITY_ORDER_ISSUE,
  availabilityFormShape,
  availabilityInOrder,
  EMPTY_AVAILABILITY,
  toAvailabilityPayload,
} from '@/entities/availability';
import { apiSchemas } from '@/shared/api';

/**
 * One form, three kinds. The fields a kind does not use are still validated —
 * they are simply empty and dropped at the payload boundary — because a
 * discriminated union here would re-register every field on each kind change
 * and lose what the author had already typed.
 */
export const materialFormSchema = z
  .object({
    kind: apiSchemas.zCreateLearningMaterialDto.shape.kind,
    title: apiSchemas.zCreateLearningMaterialDto.shape.title,
    description: z.string().max(2000),
    body: z.string().max(20_000),
    url: z.string().max(2048),
    visible: z.boolean(),
    ...availabilityFormShape,
  })
  .refine(availabilityInOrder, AVAILABILITY_ORDER_ISSUE)
  .refine(values => values.kind !== 'link' || values.url.trim() !== '', {
    path: ['url'],
    message: 'A link material needs a URL',
  })
  .refine(values => values.kind !== 'text' || values.body.trim() !== '', {
    path: ['body'],
    message: 'A text material needs some text',
  });

export type MaterialFormValues = z.infer<typeof materialFormSchema>;

export const EMPTY_MATERIAL: MaterialFormValues = {
  kind: 'file',
  title: '',
  description: '',
  body: '',
  url: '',
  visible: true,
  ...EMPTY_AVAILABILITY,
};

export function toMaterialPayload(
  values: MaterialFormValues,
  uploaded: { storageKey: string; filename: string } | null,
  timeZone: string,
  sectionId: string | null = null,
) {
  return {
    kind: values.kind,
    title: values.title,
    description: values.description === '' ? null : values.description,
    body: values.kind === 'text' ? values.body : null,
    url: values.kind === 'link' ? values.url : null,
    storageKey: uploaded?.storageKey ?? null,
    filename: uploaded?.filename ?? null,
    visible: values.visible,
    sectionId,
    ...toAvailabilityPayload(values, timeZone),
  };
}
