import { apiQueries } from '@/shared/api';

export const offeringResultQueries = {
  list: apiQueries.listOfferingResultsOptions,
  listKey: apiQueries.listOfferingResultsQueryKey,
} as const;

export const offeringResultMutations = {
  record: apiQueries.recordOfferingResultMutation,
} as const;
