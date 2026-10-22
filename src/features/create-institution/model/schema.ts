import type { z } from 'zod';

import { apiSchemas } from '@/shared/api';

export const createInstitutionFormSchema = apiSchemas.zCreateInstitutionDto.omit({
  defaultLocale: true,
  timezone: true,
});

export type CreateInstitutionFormValues = z.infer<typeof createInstitutionFormSchema>;
