import { apiQueries } from '@/shared/api';

export const sessionQueries = {
  mine: apiQueries.listMySessionsOptions,
  mineKey: apiQueries.listMySessionsQueryKey,
} as const;
