import { z } from 'zod';

import { apiSchemas } from '@/shared/api';

/**
 * Study year stays a string to the payload boundary: `z.coerce` would make the
 * schema's input and output types differ, which react-hook-form cannot type a
 * resolver against.
 */
export const admitFormSchema = apiSchemas.zAdmitToProgramDto
  .omit({ studyYear: true, status: true, startedAt: true })
  .extend({
    studyYear: z.string().regex(/^\d*$/u, 'Use a year number'),
  });

export type AdmitFormValues = z.infer<typeof admitFormSchema>;

export const MEMBERSHIP_STATUSES =
  apiSchemas.zAdmitToProgramDto.shape.status.unwrap().options;

export function toAdmitPayload(values: AdmitFormValues) {
  return {
    userId: values.userId,
    studyYear: values.studyYear === '' ? null : Number(values.studyYear),
  };
}
