import { apiQueries } from '@/shared/api';

export const timetableEventQueries = {
  list: apiQueries.listMyTimetableEventsOptions,
  listKey: apiQueries.listMyTimetableEventsQueryKey,
} as const;
