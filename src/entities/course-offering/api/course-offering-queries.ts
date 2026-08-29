import { apiQueries } from '@/shared/api';

export const courseOfferingQueries = {
  detail: apiQueries.getCourseOfferingOptions,
  detailKey: apiQueries.getCourseOfferingQueryKey,
} as const;
