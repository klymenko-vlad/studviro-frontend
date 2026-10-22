import { apiQueries } from '@/shared/api';

export const searchQueries = {
  find: apiQueries.searchOptions,
  findKey: apiQueries.searchQueryKey,
} as const;
