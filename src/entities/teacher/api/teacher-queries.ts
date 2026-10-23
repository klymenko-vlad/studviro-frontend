import { apiQueries } from '@/shared/api';

export const teacherQueries = {
  profile: apiQueries.getTeacherProfileOptions,
} as const;
