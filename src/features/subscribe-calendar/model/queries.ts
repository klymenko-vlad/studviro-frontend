import { apiQueries } from '@/shared/api';

export const calendarFeedQueries = {
  status: apiQueries.getMyCalendarFeedOptions,
  statusKey: apiQueries.getMyCalendarFeedQueryKey,
} as const;

export function calendarFileHref(institutionId: string): string {
  return `/api/proxy/api/v1/institutions/${institutionId}/me/calendar.ics`;
}
