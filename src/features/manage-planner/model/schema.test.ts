import { describe, expect, it } from 'vitest';

import {
  eventFormSchema,
  taskFormSchema,
  toEventPayload,
  toEventValues,
  toTaskPayload,
  toTaskValues,
} from './schema';

const ZONE = 'Europe/Bratislava';

describe('a task on the person’s own clock', () => {
  it('sends a due time entered at 18:00 in Bratislava as 17:00 UTC in winter', () => {
    expect(
      toTaskPayload({ title: ' Pay rent ', note: '', dueAt: '2026-11-10T18:00' }, ZONE),
    ).toEqual({ title: 'Pay rent', note: null, dueAt: '2026-11-10T17:00:00.000Z' });
  });

  it('sends an empty due time as none', () => {
    expect(
      toTaskPayload({ title: 'Call home', note: 'Sunday', dueAt: '' }, ZONE),
    ).toEqual({
      title: 'Call home',
      note: 'Sunday',
      dueAt: null,
    });
  });

  it('fills the form back from a task', () => {
    expect(
      toTaskValues(
        { title: 'Pay rent', note: null, dueAt: '2026-11-10T17:00:00.000Z' },
        ZONE,
      ),
    ).toEqual({ title: 'Pay rent', note: '', dueAt: '2026-11-10T18:00' });
  });

  it('refuses a blank title', () => {
    expect(taskFormSchema.safeParse({ title: '   ', note: '', dueAt: '' }).success).toBe(
      false,
    );
  });
});

describe('an event', () => {
  const values = {
    title: 'Volleyball',
    note: '',
    location: ' Sports hall ',
    startsAt: '2026-11-10T18:00',
    endsAt: '2026-11-10T20:00',
  };

  it('needs an end after its start', () => {
    expect(eventFormSchema.safeParse(values).success).toBe(true);
    expect(
      eventFormSchema.safeParse({ ...values, endsAt: '2026-11-10T18:00' }).success,
    ).toBe(false);
  });

  it('needs both a start and an end', () => {
    expect(eventFormSchema.safeParse({ ...values, startsAt: '' }).success).toBe(false);
  });

  it('sends wall-clock times as instants and blank text as none', () => {
    expect(toEventPayload(values, ZONE)).toEqual({
      title: 'Volleyball',
      note: null,
      location: 'Sports hall',
      startsAt: '2026-11-10T17:00:00.000Z',
      endsAt: '2026-11-10T19:00:00.000Z',
    });
  });

  it('fills the form back from an event', () => {
    expect(
      toEventValues(
        {
          title: 'Volleyball',
          note: null,
          location: null,
          startsAt: '2026-11-10T17:00:00.000Z',
          endsAt: '2026-11-10T19:00:00.000Z',
        },
        ZONE,
      ),
    ).toEqual({ ...values, location: '' });
  });
});
