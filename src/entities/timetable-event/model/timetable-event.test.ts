import { describe, expect, it } from 'vitest';

import {
  addDays,
  addWeeks,
  dayKey,
  eventDurationMinutes,
  eventTitle,
  groupEventsByDay,
  startOfWeek,
  weekRange,
  type TimetableEvent,
} from './timetable-event';

const event = (overrides: Partial<TimetableEvent> = {}): TimetableEvent => ({
  id: 'event-1',
  type: 'lecture',
  title: 'Algorithms',
  startsAt: '2026-03-02T08:00:00.000Z',
  endsAt: '2026-03-02T10:00:00.000Z',
  cancelledAt: null,
  isCancelled: false,
  attendance: 'enrolled',
  room: null,
  studyGroup: null,
  offering: { id: 'offering-1' },
  course: { id: 'course-1', code: 'INF/ALG/22', title: 'Algorithms' },
  term: { id: 'term-1', code: '2026-SS', name: 'Summer 2026' },
  ...overrides,
});

describe('startOfWeek', () => {
  it('takes Monday as the first day of the week', () => {
    expect(startOfWeek(new Date(2026, 2, 4, 13, 30))).toEqual(new Date(2026, 2, 2));
  });

  it('keeps a Monday where it is rather than jumping back a week', () => {
    expect(startOfWeek(new Date(2026, 2, 2, 23, 59))).toEqual(new Date(2026, 2, 2));
  });

  it('treats Sunday as the end of its week, not the start of the next', () => {
    expect(startOfWeek(new Date(2026, 2, 8, 12))).toEqual(new Date(2026, 2, 2));
  });
});

describe('weekRange', () => {
  it('spans one week from Monday to the next', () => {
    expect(weekRange(new Date(2026, 2, 4))).toEqual({
      from: new Date(2026, 2, 2),
      to: new Date(2026, 2, 9),
    });
  });

  it('crosses a month boundary without losing a day', () => {
    expect(weekRange(new Date(2026, 3, 1))).toEqual({
      from: new Date(2026, 2, 30),
      to: new Date(2026, 3, 6),
    });
  });
});

describe('addWeeks', () => {
  it('moves forwards and backwards by whole weeks', () => {
    expect(addWeeks(new Date(2026, 2, 2), 1)).toEqual(new Date(2026, 2, 9));
    expect(addWeeks(new Date(2026, 2, 2), -1)).toEqual(new Date(2026, 1, 23));
  });
});

const KYIV = 'Europe/Kyiv';

describe('addDays', () => {
  it('moves by whole days across a month boundary', () => {
    expect(addDays(new Date(2026, 1, 27), 3)).toEqual(new Date(2026, 2, 2));
  });
});

describe('groupEventsByDay', () => {
  it('groups the events of one day together', () => {
    const days = groupEventsByDay(
      [
        event({ id: 'a' }),
        event({
          id: 'b',
          startsAt: '2026-03-02T13:00:00.000Z',
          endsAt: '2026-03-02T15:00:00.000Z',
        }),
      ],
      KYIV,
    );

    expect(days).toHaveLength(1);
    expect(days[0]!.events.map(e => e.id)).toEqual(['a', 'b']);
  });

  it('starts a new day for an event on the next date', () => {
    const days = groupEventsByDay(
      [
        event({ id: 'a' }),
        event({
          id: 'b',
          startsAt: '2026-03-04T09:00:00.000Z',
          endsAt: '2026-03-04T11:00:00.000Z',
        }),
      ],
      KYIV,
    );

    expect(days.map(day => day.key)).toEqual(['2026-03-02', '2026-03-04']);
  });

  it('orders events by when they start even if the server did not', () => {
    const later = event({
      id: 'later',
      startsAt: '2026-03-02T13:00:00.000Z',
      endsAt: '2026-03-02T15:00:00.000Z',
    });

    const days = groupEventsByDay([later, event({ id: 'earlier' })], KYIV);

    expect(days[0]!.events.map(e => e.id)).toEqual(['earlier', 'later']);
  });

  it('has no days at all for an empty week', () => {
    expect(groupEventsByDay([], KYIV)).toEqual([]);
  });
});

describe('dayKey', () => {
  it('pads month and day so keys sort as text', () => {
    expect(dayKey(new Date('2026-01-05T12:00:00.000Z'), KYIV)).toBe('2026-01-05');
  });

  it('reads the instant in the given timezone, not the machine’s', () => {
    const lateEvening = new Date('2026-01-05T22:30:00.000Z');

    expect(dayKey(lateEvening, KYIV)).toBe('2026-01-06');
    expect(dayKey(lateEvening, 'UTC')).toBe('2026-01-05');
  });
});

describe('eventTitle', () => {
  it('prefers the event’s own title', () => {
    expect(eventTitle(event({ title: 'Guest lecture' }))).toBe('Guest lecture');
  });

  it('falls back to the course when the import carried no title', () => {
    expect(eventTitle(event({ title: null }))).toBe('Algorithms');
  });
});

describe('eventDurationMinutes', () => {
  it('measures the event in whole minutes', () => {
    expect(eventDurationMinutes(event())).toBe(120);
  });
});
