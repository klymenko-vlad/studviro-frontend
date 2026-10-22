import type { Deadline } from '@/entities/deadline';
import type { ExamTerm } from '@/entities/exam-term';
import { dayKey, type TimetableEvent } from '@/entities/timetable-event';

type CalendarItem =
  | { kind: 'event'; id: string; startsAt: string; event: TimetableEvent }
  | { kind: 'exam'; id: string; startsAt: string; term: ExamTerm }
  | { kind: 'deadline'; id: string; startsAt: string; deadline: Deadline };

export interface CalendarDay {
  key: string;
  date: Date;
  items: CalendarItem[];
}

/**
 * An exam term is a registrar record with a registration window and a seat count, not a
 * timetable event with a room and a study group. Merging them into one query would blur
 * that provenance, so the calendar fetches them separately and interleaves them here —
 * see ADR 0013. An assignment deadline is a third such record — an instant a learning
 * activity falls due, with no room and no seat — and layers the same way.
 */
export function groupCalendarItems(
  events: TimetableEvent[],
  examTerms: ExamTerm[],
  deadlines: Deadline[],
  timeZone: string,
): CalendarDay[] {
  const items: CalendarItem[] = [
    ...events.map((event): CalendarItem => ({
      kind: 'event',
      id: `event-${event.id}`,
      startsAt: event.startsAt,
      event,
    })),
    ...examTerms.map((term): CalendarItem => ({
      kind: 'exam',
      id: `exam-${term.id}`,
      startsAt: term.startsAt,
      term,
    })),
    ...deadlines.map((deadline): CalendarItem => ({
      kind: 'deadline',
      id: `deadline-${deadline.id}`,
      startsAt: deadline.dueAt,
      deadline,
    })),
  ].sort(
    (left, right) =>
      left.startsAt.localeCompare(right.startsAt) || left.id.localeCompare(right.id),
  );

  const days: CalendarDay[] = [];

  for (const item of items) {
    const date = new Date(item.startsAt);
    const key = dayKey(date, timeZone);
    const current = days.at(-1);

    if (current?.key === key) current.items.push(item);
    else days.push({ key, date, items: [item] });
  }

  return days;
}
