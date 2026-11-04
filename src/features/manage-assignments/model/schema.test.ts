import { describe, expect, it } from 'vitest';

import type { Assignment } from '@/entities/assignment';
import { offeringAssignments } from '@/shared/test';

import {
  assignmentFormSchema,
  EMPTY_ASSIGNMENT,
  toAssignmentPayload,
  toFormValues,
} from './schema';

const offeringAssignment = offeringAssignments[0]!;

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

describe('when an assignment counts as complete', () => {
  const base = { ...EMPTY_ASSIGNMENT, name: 'Essay', maxPoints: '20' };

  it('tracks nothing by default and sends no pass mark', () => {
    expect(toAssignmentPayload(base, BRATISLAVA)).toMatchObject({
      completionRule: 'none',
      completionPassPoints: null,
    });
  });

  it('sends a pass mark only with the rule that uses it', () => {
    expect(
      toAssignmentPayload(
        { ...base, completionRule: 'passed', completionPassPoints: '12' },
        BRATISLAVA,
      ),
    ).toMatchObject({ completionRule: 'passed', completionPassPoints: 12 });
    expect(
      toAssignmentPayload(
        { ...base, completionRule: 'marked', completionPassPoints: '12' },
        BRATISLAVA,
      ).completionPassPoints,
    ).toBeNull();
  });

  it('asks for a pass mark no higher than the assignment is worth', () => {
    const parse = (completionPassPoints: string) =>
      assignmentFormSchema.safeParse({
        ...base,
        completionRule: 'passed',
        completionPassPoints,
      }).success;

    expect(parse('')).toBe(false);
    expect(parse('21')).toBe(false);
    expect(parse('20')).toBe(true);
    expect(parse('0')).toBe(true);
  });

  it('reads the rule back into the form', () => {
    expect(
      toFormValues(
        { ...offeringAssignment, completionRule: 'passed', completionPassPoints: 50 },
        BRATISLAVA,
      ),
    ).toMatchObject({ completionRule: 'passed', completionPassPoints: '50' });
  });
});
