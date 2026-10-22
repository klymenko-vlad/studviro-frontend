import { apiQueries } from '@/shared/api';

export const examTermQueries = {
  list: apiQueries.listMyExamTermsOptions,
  listKey: apiQueries.listMyExamTermsQueryKey,
} as const;

export const examRegistrationMutations = {
  register: apiQueries.registerForExamTermMutation,
  cancel: apiQueries.cancelExamRegistrationMutation,
} as const;
