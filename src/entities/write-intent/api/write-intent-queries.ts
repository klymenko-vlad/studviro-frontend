import { apiQueries } from '@/shared/api';

export const writeIntentQueries = {
  list: apiQueries.listSourceWriteIntentsOptions,
  listKey: apiQueries.listSourceWriteIntentsQueryKey,
} as const;

export const writeIntentMutations = {
  retry: apiQueries.retrySourceWriteIntentMutation,
  discard: apiQueries.discardSourceWriteIntentMutation,
} as const;
