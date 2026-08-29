import type { MyTimetableEventResponseDto } from '@/shared/api';

export type TimetableEvent = MyTimetableEventResponseDto;
export type TimetableEventType = TimetableEvent['type'];
export type TimetableAttendance = TimetableEvent['attendance'];

export interface TimetableDay {
  key: string;
  date: Date;
  events: TimetableEvent[];
}

export interface TimetableRange {
  from: Date;
  to: Date;
}

const DAYS_IN_WEEK = 7;

export function startOfWeek(reference: Date): Date {
  const start = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
  );
  const mondayOffset = (start.getDay() + 6) % DAYS_IN_WEEK;

  start.setDate(start.getDate() - mondayOffset);

  return start;
}

export function addDays(reference: Date, days: number): Date {
  const shifted = new Date(reference);

  shifted.setDate(shifted.getDate() + days);

  return shifted;
}

export function addWeeks(reference: Date, weeks: number): Date {
  return addDays(reference, weeks * DAYS_IN_WEEK);
}

export function weekRange(reference: Date): TimetableRange {
  const from = startOfWeek(reference);

  return { from, to: addWeeks(from, 1) };
}

/**
 * The day an instant falls on depends on where the reader is, and the app reads
 * every date in the institution's timezone rather than the browser's — so the
 * grouping has to use the same one or an evening class lands on the wrong day.
 */
export function dayKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function groupEventsByDay(
  events: TimetableEvent[],
  timeZone: string,
): TimetableDay[] {
  const days: TimetableDay[] = [];

  for (const event of [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt))) {
    const date = new Date(event.startsAt);
    const key = dayKey(date, timeZone);
    const current = days.at(-1);

    if (current?.key === key) current.events.push(event);
    else days.push({ key, date, events: [event] });
  }

  return days;
}

export function eventTitle(event: TimetableEvent): string {
  return event.title ?? event.course.title;
}

export function eventDurationMinutes(event: TimetableEvent): number {
  const span = new Date(event.endsAt).getTime() - new Date(event.startsAt).getTime();

  return Math.round(span / 60_000);
}
