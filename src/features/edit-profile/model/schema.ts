import type { z } from 'zod';

import { apiSchemas } from '@/shared/api';

export const editProfileSchema = apiSchemas.zUpdateMeDto
  .pick({ displayName: true })
  .required();

export type EditProfileValues = z.infer<typeof editProfileSchema>;
