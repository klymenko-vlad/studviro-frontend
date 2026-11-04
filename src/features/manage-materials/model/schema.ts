import { z } from 'zod';

import {
  AVAILABILITY_ORDER_ISSUE,
  availabilityFormShape,
  availabilityInOrder,
  EMPTY_AVAILABILITY,
  toAvailabilityPayload,
} from '@/entities/availability';
import { MATERIAL_COMPLETION_RULES } from '@/entities/completion';
import type { MaterialKind } from '@/entities/learning-material';
import { apiSchemas } from '@/shared/api';

const BODY_LIMITS: Partial<Record<MaterialKind, number>> = {
  text: 20_000,
  page: 100_000,
  label: 1000,
};
const KINDS_WITH_URL: readonly MaterialKind[] = ['link', 'video'];

const hasBody = (kind: MaterialKind) => BODY_LIMITS[kind] !== undefined;
const hasUrl = (kind: MaterialKind) => KINDS_WITH_URL.includes(kind);

interface Content {
  title: string;
  body: string;
  url: string;
}

function contentIssues(kind: MaterialKind, values: Content, ctx: z.RefinementCtx) {
  const required = (field: keyof Content) => {
    ctx.addIssue({
      code: 'too_small',
      origin: 'string',
      minimum: 1,
      inclusive: true,
      input: values[field],
      path: [field],
    });
  };

  if (kind !== 'label' && values.title.trim() === '') required('title');
  const limit = BODY_LIMITS[kind];
  if (limit !== undefined && values.body.trim() === '') required('body');
  if (limit !== undefined && values.body.length > limit) {
    ctx.addIssue({
      code: 'too_big',
      origin: 'string',
      maximum: limit,
      inclusive: true,
      input: values.body,
      path: ['body'],
    });
  }
  if (hasUrl(kind) && values.url.trim() === '') required('url');
}

const contentShape = {
  title: z.string().max(200),
  body: z.string(),
  url: z.string().max(2048),
};

/**
 * One form, every kind. The fields a kind does not use are still validated —
 * they are simply empty and dropped at the payload boundary — because a
 * discriminated union here would re-register every field on each kind change
 * and lose what the author had already typed.
 */
export const materialFormSchema = z
  .object({
    kind: apiSchemas.zCreateLearningMaterialDto.shape.kind,
    ...contentShape,
    description: z.string().max(2000),
    visible: z.boolean(),
    completionRule: z.enum(MATERIAL_COMPLETION_RULES),
    ...availabilityFormShape,
  })
  .refine(availabilityInOrder, AVAILABILITY_ORDER_ISSUE)
  .superRefine((values, ctx) => {
    contentIssues(values.kind, values, ctx);
  });

export type MaterialFormValues = z.infer<typeof materialFormSchema>;

export const EMPTY_MATERIAL: MaterialFormValues = {
  kind: 'file',
  title: '',
  description: '',
  body: '',
  url: '',
  visible: true,
  completionRule: 'none',
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
    ...(values.kind === 'label' ? {} : { title: values.title }),
    description: values.description === '' ? null : values.description,
    body: hasBody(values.kind) ? values.body : null,
    url: hasUrl(values.kind) ? values.url : null,
    storageKey: uploaded?.storageKey ?? null,
    filename: uploaded?.filename ?? null,
    visible: values.visible,
    completionRule: values.kind === 'label' ? 'none' : values.completionRule,
    sectionId,
    ...toAvailabilityPayload(values, timeZone),
  };
}

export const materialEditSchema = (kind: MaterialKind) =>
  z.object(contentShape).superRefine((values, ctx) => {
    contentIssues(kind, values, ctx);
  });

export type MaterialEditValues = Content;

export function toMaterialEdit(kind: MaterialKind, values: MaterialEditValues) {
  return {
    ...(kind === 'label' ? {} : { title: values.title }),
    ...(hasBody(kind) ? { body: values.body } : {}),
    ...(hasUrl(kind) ? { url: values.url } : {}),
  };
}
