import { apiQueries } from '@/shared/api';

export const linkedAccountQueries = {
  mine: apiQueries.listMyIdentitiesOptions,
  mineKey: apiQueries.listMyIdentitiesQueryKey,
} as const;
