import { apiQueries } from '@/shared/api';

export const enrollableOfferingQueries = {
  list: apiQueries.listEnrollableOfferingsOptions,
  listKey: apiQueries.listEnrollableOfferingsQueryKey,
} as const;

export const enrollmentMutations = {
  request: apiQueries.requestEnrollmentMutation,
  withdraw: apiQueries.withdrawFromCourseMutation,
} as const;
