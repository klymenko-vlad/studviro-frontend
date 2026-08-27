import { apiQueries } from '@/shared/api';

export const enrolledCourseQueries = {
  list: apiQueries.listMyCoursesOptions,
  listKey: apiQueries.listMyCoursesQueryKey,
} as const;
