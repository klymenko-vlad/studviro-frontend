import { apiQueries } from '@/shared/api';

export const courseWaitlistQueries = {
  list: apiQueries.listCourseWaitlistOptions,
  listKey: apiQueries.listCourseWaitlistQueryKey,
} as const;

export const courseWaitlistMutations = {
  decide: apiQueries.correctEnrollmentMutation,
} as const;
