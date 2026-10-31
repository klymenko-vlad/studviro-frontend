import { apiQueries } from '@/shared/api';

export const courseRosterQueries = {
  detail: apiQueries.getCourseRosterOptions,
  detailKey: apiQueries.getCourseRosterQueryKey,
} as const;

export const courseRosterMutations = {
  correct: apiQueries.correctEnrollmentMutation,
} as const;
