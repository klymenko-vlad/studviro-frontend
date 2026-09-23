import { describe, expect, it } from 'vitest';

import { canRecordAttendance, isAttendanceOutcome } from './exam-registrant';
import type { OfferingExamTerm } from './offering-exam-term';

const term = (overrides: Partial<OfferingExamTerm> = {}): OfferingExamTerm => ({
  id: 'b1b1b1b1-b1b1-4b1b-8b1b-b1b1b1b1b1b1',
  kind: 'regular',
  startsAt: '2026-09-01T09:00:00.000Z',
  endsAt: null,
  capacity: null,
  seatsTaken: 0,
  registrationOpensAt: null,
  registrationClosesAt: null,
  cancelledAt: null,
  roomId: null,
  roomCode: null,
  examinerId: null,
  examinerName: null,
  ...overrides,
});

describe('canRecordAttendance', () => {
  const now = new Date('2026-09-23T12:00:00.000Z');

  it('allows a term that has started', () => {
    expect(canRecordAttendance(term(), now)).toBe(true);
  });

  it('allows the very moment it starts', () => {
    expect(canRecordAttendance(term({ startsAt: now.toISOString() }), now)).toBe(true);
  });

  it('refuses a term still to come', () => {
    expect(canRecordAttendance(term({ startsAt: '2026-10-01T09:00:00.000Z' }), now)).toBe(
      false,
    );
  });

  it('refuses a term that was called off', () => {
    expect(
      canRecordAttendance(term({ cancelledAt: '2026-08-30T00:00:00.000Z' }), now),
    ).toBe(false);
  });
});

describe('isAttendanceOutcome', () => {
  it('knows the three outcomes and nothing else', () => {
    expect(['attended', 'no_show', 'excused'].every(isAttendanceOutcome)).toBe(true);
    expect(isAttendanceOutcome('registered')).toBe(false);
    expect(isAttendanceOutcome('cancelled')).toBe(false);
  });
});
