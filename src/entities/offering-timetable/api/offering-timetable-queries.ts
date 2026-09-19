import { apiQueries } from '@/shared/api';

export const offeringTimetableQueries = {
  list: apiQueries.listOfferingTimetableOptions,
  listKey: apiQueries.listOfferingTimetableQueryKey,
} as const;

export const offeringTimetableMutations = {
  create: apiQueries.createTimetableEventMutation,
  update: apiQueries.updateTimetableEventMutation,
  cancel: apiQueries.cancelTimetableEventMutation,
  restore: apiQueries.restoreTimetableEventMutation,
  remove: apiQueries.removeTimetableEventMutation,
} as const;
