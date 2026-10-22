import { apiQueries } from '@/shared/api';

export const learningSpaceQueries = {
  list: apiQueries.listLearningSpacesOptions,
  listKey: apiQueries.listLearningSpacesQueryKey,
} as const;

export const learningSpaceMutations = {
  create: apiQueries.createLearningSpaceMutation,
  update: apiQueries.updateLearningSpaceMutation,
} as const;
