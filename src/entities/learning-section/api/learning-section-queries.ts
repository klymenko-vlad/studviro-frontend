import { apiQueries } from '@/shared/api';

export const learningSectionQueries = {
  list: apiQueries.listLearningSectionsOptions,
  listKey: apiQueries.listLearningSectionsQueryKey,
} as const;

export const learningSectionMutations = {
  create: apiQueries.createLearningSectionMutation,
  update: apiQueries.updateLearningSectionMutation,
  remove: apiQueries.removeLearningSectionMutation,
} as const;
