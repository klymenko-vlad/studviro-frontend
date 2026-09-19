import type { TimetableEventResponseDto } from '@/shared/api';

export type OfferingTimetableEvent = TimetableEventResponseDto;

export function isCancelled(event: OfferingTimetableEvent): boolean {
  return event.cancelledAt !== null;
}

/** The day of the week the class falls on where the institution is, 0 = Sunday. */
function weekdayIn(at: Date, timeZone?: string): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(
    at,
  );
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return Math.max(0, days.indexOf(name));
}

/**
 * A weekly slot is a row per week, so a term's timetable is dozens of rows
 * that differ only by date. Grouping them back into the slot they came from —
 * same weekday, same time, same room, same group — is what makes the panel
 * readable, and it is derived rather than stored precisely so that moving one
 * week simply drops it into its own group.
 */
export interface TimetableSlot {
  readonly key: string;
  readonly weekday: number;
  readonly events: OfferingTimetableEvent[];
}

export function bySlot(
  events: readonly OfferingTimetableEvent[],
  timeZone?: string,
): TimetableSlot[] {
  const slots = new Map<string, TimetableSlot>();
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  for (const event of events) {
    const startsAt = new Date(event.startsAt);
    const local = parts.format(startsAt);
    const key = [local, event.type, event.roomId ?? '', event.studyGroupId ?? ''].join(
      '|',
    );

    const existing = slots.get(key);
    if (existing) existing.events.push(event);
    else slots.set(key, { key, weekday: weekdayIn(startsAt, timeZone), events: [event] });
  }

  return [...slots.values()].sort((a, b) => {
    const first = a.events[0];
    const second = b.events[0];
    if (!first || !second) return 0;

    return first.startsAt.localeCompare(second.startsAt);
  });
}
