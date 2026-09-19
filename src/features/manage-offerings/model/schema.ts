import { z } from 'zod';

import { apiSchemas } from '@/shared/api';

/**
 * Capacity stays a string to the payload boundary: `z.coerce` would make the
 * schema's input and output types differ, which react-hook-form cannot type a
 * resolver against.
 */
export const offeringFormSchema = apiSchemas.zCreateCourseOfferingDto
  .omit({ capacity: true, language: true, orgUnitId: true })
  .extend({
    capacity: z.string().regex(/^\d*$/u, 'Use a whole number of places'),
    language: z.string().max(64),
  });

export type OfferingFormValues = z.infer<typeof offeringFormSchema>;

export const OFFERING_STATUSES =
  apiSchemas.zCreateCourseOfferingDto.shape.status.unwrap().options;

export function toCreatePayload(values: OfferingFormValues) {
  return {
    courseId: values.courseId,
    academicTermId: values.academicTermId,
    status: values.status,
    capacity: values.capacity === '' ? null : Number(values.capacity),
    language: values.language === '' ? null : values.language,
  };
}
