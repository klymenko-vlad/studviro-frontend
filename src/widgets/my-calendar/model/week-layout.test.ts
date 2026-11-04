import { describe, expect, it } from 'vitest';

import type { Deadline } from '@/entities/deadline';
import type { ExamTerm } from '@/entities/exam-term';
import type { TimetableEvent } from '@/entities/timetable-event';

import type { CalendarItem } from './calendar-items';
import { layoutWeek } from './week-layout';

const UTC = 'UTC';
const DAYS = ['2026-10-19', '2026-10-20', '2026-10-21'];

const event = (id: string, startsAt: string, endsAt: string): CalendarItem => ({
  kind: 'event',
  id: `event-${id}`,
  startsAt,
  event: { id, startsAt, endsAt } as TimetableEvent,
});
const exam = (id: string, startsAt: string, endsAt: string | null): CalendarItem => ({
  kind: 'exam',
  id: `exam-${id}`,
  startsAt,
  term: { id, startsAt, endsAt } as ExamTerm,
});
const deadline = (id: string, dueAt: string): CalendarItem => ({
  kind: 'deadline',
  id: `deadline-${id}`,
  startsAt: dueAt,
  deadline: { id, dueAt } as Deadline,
});

describe('layoutWeek', () => {
  it('places a class in its day’s column at its own minutes', () => {
    const week = layoutWeek(
      [event('a', '2026-10-20T09:30:00.000Z', '2026-10-20T11:00:00.000Z')],
      DAYS,
      UTC,
    );

    const block = week.columns[1]!.blocks[0]!;
    expect(block).toMatchObject({ start: 9 * 60 + 30, end: 11 * 60, lane: 0, lanes: 1 });
    expect(week.columns[0]!.blocks).toEqual([]);
  });

  it('puts two classes that overlap side by side, and a later one back full width', () => {
    const week = layoutWeek(
      [
        event('a', '2026-10-19T09:00:00.000Z', '2026-10-19T11:00:00.000Z'),
        event('b', '2026-10-19T10:00:00.000Z', '2026-10-19T12:00:00.000Z'),
        event('c', '2026-10-19T13:00:00.000Z', '2026-10-19T14:00:00.000Z'),
      ],
      DAYS,
      UTC,
    );

    const lanes = week.columns[0]!.blocks.map(block => [block.lane, block.lanes]);
    expect(lanes).toEqual([
      [0, 2],
      [1, 2],
      [0, 1],
    ]);
  });

  it('gives an exam without an end an hour and a half', () => {
    const week = layoutWeek([exam('x', '2026-10-21T08:00:00.000Z', null)], DAYS, UTC);

    expect(week.columns[2]!.blocks[0]).toMatchObject({ start: 480, end: 570 });
  });

  it('keeps deadlines out of the hours, in the day’s top strip', () => {
    const week = layoutWeek([deadline('d', '2026-10-20T23:59:00.000Z')], DAYS, UTC);

    expect(week.columns[1]!.blocks).toEqual([]);
    expect(week.columns[1]!.allDay.map(item => item.id)).toEqual(['deadline-d']);
  });

  it('spans the working day by default and stretches to fit early and late classes', () => {
    expect(layoutWeek([], DAYS, UTC)).toMatchObject({ firstHour: 8, lastHour: 18 });

    const week = layoutWeek(
      [event('a', '2026-10-19T07:15:00.000Z', '2026-10-19T20:30:00.000Z')],
      DAYS,
      UTC,
    );
    expect(week).toMatchObject({ firstHour: 7, lastHour: 21 });
  });

  it('reads the hours on the institution’s clock', () => {
    const week = layoutWeek(
      [event('a', '2026-10-20T07:00:00.000Z', '2026-10-20T08:00:00.000Z')],
      DAYS,
      'Europe/Bratislava',
    );

    expect(week.columns[1]!.blocks[0]).toMatchObject({ start: 9 * 60 });
  });
});
