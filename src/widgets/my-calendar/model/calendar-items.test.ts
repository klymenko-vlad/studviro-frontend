import { describe, expect, it } from 'vitest';

import type { ExamTerm } from '@/entities/exam-term';
import type { TimetableEvent } from '@/entities/timetable-event';

import { groupCalendarItems } from './calendar-items';

const KYIV = 'Europe/Kyiv';

const event = (id: string, startsAt: string) => ({ id, startsAt }) as TimetableEvent;
const exam = (id: string, startsAt: string) => ({ id, startsAt }) as ExamTerm;

describe('groupCalendarItems', () => {
  it('interleaves an exam term among the classes of its day by start time', () => {
    const days = groupCalendarItems(
      [event('a', '2026-06-02T08:00:00.000Z'), event('b', '2026-06-02T14:00:00.000Z')],
      [exam('x', '2026-06-02T11:00:00.000Z')],
      KYIV,
    );

    expect(days).toHaveLength(1);
    expect(days[0]!.items.map(item => item.id)).toEqual(['event-a', 'exam-x', 'event-b']);
  });

  it('keeps the two layers distinguishable rather than flattening an exam into an event', () => {
    const [day] = groupCalendarItems([], [exam('x', '2026-06-02T11:00:00.000Z')], KYIV);

    expect(day!.items[0]).toMatchObject({ kind: 'exam', term: { id: 'x' } });
  });

  it('starts a new day for an exam that falls on the next date', () => {
    const days = groupCalendarItems(
      [event('a', '2026-06-02T08:00:00.000Z')],
      [exam('x', '2026-06-03T08:00:00.000Z')],
      KYIV,
    );

    expect(days.map(day => day.key)).toEqual(['2026-06-02', '2026-06-03']);
  });

  it('groups in the institution’s timezone, not the reader’s', () => {
    const days = groupCalendarItems([], [exam('x', '2026-06-02T22:30:00.000Z')], KYIV);

    expect(days[0]!.key).toBe('2026-06-03');
  });

  it('returns no days when neither layer has anything for the week', () => {
    expect(groupCalendarItems([], [], KYIV)).toEqual([]);
  });

  it('orders an exam and a class that start at the same instant deterministically', () => {
    const at = '2026-06-02T08:00:00.000Z';
    const first = groupCalendarItems([event('a', at)], [exam('x', at)], KYIV);
    const second = groupCalendarItems([event('a', at)], [exam('x', at)], KYIV);

    expect(first[0]!.items.map(i => i.id)).toEqual(second[0]!.items.map(i => i.id));
  });
});
