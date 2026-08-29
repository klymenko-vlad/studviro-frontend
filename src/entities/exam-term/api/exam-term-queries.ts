import { apiQueries } from '@/shared/api';

export const examTermQueries = {
  list: apiQueries.listMyExamTermsOptions,
  listKey: apiQueries.listMyExamTermsQueryKey,
} as const;
