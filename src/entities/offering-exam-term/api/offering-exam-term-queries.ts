import { apiQueries } from '@/shared/api';

export const offeringExamTermQueries = {
  list: apiQueries.listOfferingExamTermsOptions,
  listKey: apiQueries.listOfferingExamTermsQueryKey,
} as const;

export const offeringExamTermMutations = {
  create: apiQueries.createExamTermMutation,
  update: apiQueries.updateExamTermMutation,
  cancel: apiQueries.cancelExamTermMutation,
  remove: apiQueries.removeExamTermMutation,
} as const;
