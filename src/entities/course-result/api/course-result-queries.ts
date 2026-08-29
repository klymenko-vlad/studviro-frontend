import { apiQueries } from '@/shared/api';

export const courseResultQueries = {
  list: apiQueries.listMyCourseResultsOptions,
  listKey: apiQueries.listMyCourseResultsQueryKey,
} as const;
