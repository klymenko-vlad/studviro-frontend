import { apiQueries } from '@/shared/api';

export const syncRunQueries = {
  list: apiQueries.listSynchronizationRunsOptions,
  listKey: apiQueries.listSynchronizationRunsQueryKey,
  detail: apiQueries.getSynchronizationRunOptions,
  detailKey: apiQueries.getSynchronizationRunQueryKey,
  state: apiQueries.getSynchronizationStateOptions,
  stateKey: apiQueries.getSynchronizationStateQueryKey,
} as const;

export const syncRunMutations = {
  start: apiQueries.startSynchronizationRunMutation,
} as const;
