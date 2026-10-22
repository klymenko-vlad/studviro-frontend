import type { z } from 'zod';

import { apiSchemas } from '@/shared/api';

export const assignTeacherFormSchema = apiSchemas.zAssignTeacherDto.extend({
  role: apiSchemas.zAssignTeacherDto.shape.role.unwrap(),
  isPrimary: apiSchemas.zAssignTeacherDto.shape.isPrimary.unwrap(),
});

export type AssignTeacherFormValues = z.infer<typeof assignTeacherFormSchema>;

export const TEACHING_ROLES = apiSchemas.zAssignTeacherDto.shape.role.unwrap().options;
