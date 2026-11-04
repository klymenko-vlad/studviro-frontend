import type { DownloadMyCalendarEntryData } from '@/shared/api';

export type CalendarEntryKind = DownloadMyCalendarEntryData['path']['kind'];

export function calendarEntryHref(
  institutionId: string,
  kind: CalendarEntryKind,
  id: string,
): string {
  return `/api/proxy/api/v1/institutions/${institutionId}/me/calendar-entries/${kind}/${id}`;
}
