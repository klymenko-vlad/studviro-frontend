import { z } from 'zod';

import type { LearningSection } from '@/entities/learning-section';
import { apiSchemas } from '@/shared/api';

export const sectionFormSchema = z.object({
  title: apiSchemas.zCreateLearningSectionDto.shape.title.refine(
    value => value.trim() !== '',
    { message: 'A section needs a title' },
  ),
  summary: z.string().max(4000),
});

export type SectionFormValues = z.infer<typeof sectionFormSchema>;

export const EMPTY_SECTION: SectionFormValues = { title: '', summary: '' };

export function toSectionFormValues(section: LearningSection): SectionFormValues {
  return { title: section.title, summary: section.summary ?? '' };
}

export function toSectionPayload(values: SectionFormValues) {
  const summary = values.summary.trim();

  return { title: values.title.trim(), summary: summary === '' ? null : summary };
}
