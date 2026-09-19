import { z } from 'zod';

import type { LearningSpace } from '@/entities/learning-space';
import { apiSchemas } from '@/shared/api';

/**
 * A space is authored, not derived (ADR 0028). The optional-and-nullable fields
 * stay strings in the form and become `null` at the payload boundary, so an
 * emptied summary clears the stored one instead of leaving it behind.
 */
export const learningSpaceFormSchema = z.object({
  name: apiSchemas.zCreateLearningSpaceDto.shape.name,
  shortName: z.string().max(64),
  summary: z.string().max(4000),
  visible: z.boolean(),
});

export type LearningSpaceFormValues = z.infer<typeof learningSpaceFormSchema>;

export const EMPTY_SPACE: LearningSpaceFormValues = {
  name: '',
  shortName: '',
  summary: '',
  visible: false,
};

export function toFormValues(space: LearningSpace): LearningSpaceFormValues {
  return {
    name: space.name,
    shortName: space.shortName ?? '',
    summary: space.summary ?? '',
    visible: space.visible,
  };
}

export function toSpacePayload(values: LearningSpaceFormValues) {
  return {
    name: values.name,
    shortName: values.shortName === '' ? null : values.shortName,
    summary: values.summary === '' ? null : values.summary,
    visible: values.visible,
  };
}
