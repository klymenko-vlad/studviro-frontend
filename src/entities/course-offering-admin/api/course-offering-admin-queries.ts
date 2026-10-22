import { apiQueries } from '@/shared/api';

export const offeringAdminQueries = {
  list: apiQueries.listCourseOfferingsOptions,
  listKey: apiQueries.listCourseOfferingsQueryKey,
} as const;

export const offeringAdminMutations = {
  create: apiQueries.createCourseOfferingMutation,
  update: apiQueries.updateCourseOfferingMutation,
  remove: apiQueries.removeCourseOfferingMutation,
} as const;
