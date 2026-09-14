import { apiQueries } from '@/shared/api';

export const learningSpaceQueries = {
  list: apiQueries.listLearningSpacesOptions,
  listKey: apiQueries.listLearningSpacesQueryKey,
} as const;
