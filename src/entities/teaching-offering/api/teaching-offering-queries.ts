import { apiQueries } from '@/shared/api';

export const teachingOfferingQueries = {
  list: apiQueries.listMyTeachingOfferingsOptions,
  listKey: apiQueries.listMyTeachingOfferingsQueryKey,
} as const;
