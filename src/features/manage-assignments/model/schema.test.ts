import { describe, expect, it } from 'vitest';

import type { Assignment } from '@/entities/assignment';

import { EMPTY_ASSIGNMENT, toAssignmentPayload, toFormValues } from './schema';

const BRATISLAVA = 'Europe/Bratislava';

describe('assignment times on the institution’s clock (B31)', () => {
  it('stores a deadline typed as 23:59 as 23:59 in the institution', () => {
    const payload = toAssignmentPayload(
      {
        ...EMPTY_ASSIGNMENT,
        name: 'Essay',
        opensAt: '2026-11-02T08:00',
        dueAt: '2026-11-16T23:59',
      },
      BRATISLAVA,
    );

    expect(payload.opensAt).toBe('2026-11-02T07:00:00.000Z');
    expect(payload.dueAt).toBe('2026-11-16T22:59:00.000Z');
    expect(payload.closesAt).toBeNull();
    expect(payload.availableFrom).toBeNull();
  });

  it('sends when students first see it, apart from when they may hand in', () => {
    const payload = toAssignmentPayload(
      {
        ...EMPTY_ASSIGNMENT,
        name: 'Essay',
        availableFrom: '2026-11-01T08:00',
        opensAt: '2026-11-02T08:00',
        hiddenUntilAvailable: true,
      },
      BRATISLAVA,
    );

    expect(payload).toMatchObject({
      availableFrom: '2026-11-01T07:00:00.000Z',
      opensAt: '2026-11-02T07:00:00.000Z',
      availableUntil: null,
      hiddenUntilAvailable: true,
    });
  });

  it('opens an existing assignment on the times it was entered at', () => {
    const assignment = {
      name: 'Essay',
      brief: null,
      opensAt: null,
      dueAt: '2026-11-16T22:59:00.000Z',
      closesAt: null,
      maxAttempts: 1,
      allowsLateSubmission: false,
      maxPoints: null,
      countsTowardFinalGrade: true,
      visible: true,
      availableFrom: '2026-11-01T07:00:00.000Z',
      availableUntil: null,
      hiddenUntilAvailable: false,
    } as unknown as Assignment;

    expect(toFormValues(assignment, BRATISLAVA)).toMatchObject({
      opensAt: '',
      dueAt: '2026-11-16T23:59',
      availableFrom: '2026-11-01T08:00',
      availableUntil: '',
    });
  });
});
