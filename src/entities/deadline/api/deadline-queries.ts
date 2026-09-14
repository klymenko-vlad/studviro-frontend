import { apiQueries } from '@/shared/api';

export const deadlineQueries = {
  list: apiQueries.listMyDeadlinesOptions,
  listKey: apiQueries.listMyDeadlinesQueryKey,
} as const;
