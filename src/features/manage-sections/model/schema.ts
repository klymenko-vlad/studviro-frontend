import { z } from 'zod';

import {
  AVAILABILITY_ORDER_ISSUE,
  availabilityFormShape,
  availabilityInOrder,
  EMPTY_AVAILABILITY,
  toAvailabilityPayload,
  toAvailabilityValues,
} from '@/entities/availability';
import type { LearningSection } from '@/entities/learning-section';
import { apiSchemas } from '@/shared/api';

export const sectionFormSchema = z
  .object({
    title: apiSchemas.zCreateLearningSectionDto.shape.title.refine(
      value => value.trim() !== '',
      { message: 'A section needs a title' },
    ),
    summary: z.string().max(4000),
    ...availabilityFormShape,
  })
  .refine(availabilityInOrder, AVAILABILITY_ORDER_ISSUE);

export type SectionFormValues = z.infer<typeof sectionFormSchema>;

export const EMPTY_SECTION: SectionFormValues = {
  title: '',
  summary: '',
  ...EMPTY_AVAILABILITY,
};

export function toSectionFormValues(
  section: LearningSection,
  timeZone: string,
): SectionFormValues {
  return {
    title: section.title,
    summary: section.summary ?? '',
    ...toAvailabilityValues(section, timeZone),
  };
}

export function toSectionPayload(values: SectionFormValues, timeZone: string) {
  const summary = values.summary.trim();

  return {
    title: values.title.trim(),
    summary: summary === '' ? null : summary,
    ...toAvailabilityPayload(values, timeZone),
  };
}
