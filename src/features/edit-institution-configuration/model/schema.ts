import { z } from 'zod';

import { LOCALES } from '@/shared/config';

const MAX_LABEL_LENGTH = 64;

export const institutionConfigurationFormSchema = z.object({
  defaultLocale: z.enum(LOCALES),
  timezone: z.string().trim().min(1),
  terminology: z.record(z.string(), z.string().max(MAX_LABEL_LENGTH)),
  features: z.record(z.string(), z.boolean()),
});

export type InstitutionConfigurationFormValues = z.infer<
  typeof institutionConfigurationFormSchema
>;
