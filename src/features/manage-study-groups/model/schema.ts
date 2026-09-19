import { z } from 'zod';

import { apiSchemas } from '@/shared/api';

/**
 * Capacity stays a string to the payload boundary: `z.coerce` would make the
 * schema's input and output types differ, which react-hook-form cannot type a
 * resolver against.
 */
export const studyGroupFormSchema = apiSchemas.zCreateStudyGroupDto
  .omit({ capacity: true, name: true, kind: true })
  .extend({
    kind: apiSchemas.zCreateStudyGroupDto.shape.kind.unwrap(),
    name: z.string().max(200),
    capacity: z.string().regex(/^\d*$/u, 'Use a whole number of places'),
  });

export type StudyGroupFormValues = z.infer<typeof studyGroupFormSchema>;

export const STUDY_GROUP_KINDS =
  apiSchemas.zCreateStudyGroupDto.shape.kind.unwrap().options;

export function toCreatePayload(values: StudyGroupFormValues) {
  return {
    code: values.code,
    kind: values.kind,
    name: values.name === '' ? null : values.name,
    capacity: values.capacity === '' ? null : Number(values.capacity),
  };
}
