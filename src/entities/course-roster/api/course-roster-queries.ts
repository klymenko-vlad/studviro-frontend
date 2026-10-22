import { apiQueries } from '@/shared/api';

export const courseRosterQueries = {
  detail: apiQueries.getCourseRosterOptions,
  detailKey: apiQueries.getCourseRosterQueryKey,
} as const;
