import { describe, expect, it } from 'vitest';

import {
  examRegistrationLabel,
  examSeatsLabelKey,
  isRegistered,
  splitExamTerms,
  type ExamTerm,
} from './exam-term';

const term = (overrides: Partial<ExamTerm> = {}): ExamTerm => ({
  id: 'exam-1',
  kind: 'regular',
  startsAt: '2026-06-02T09:00:00.000Z',
  endsAt: '2026-06-02T12:00:00.000Z',
  cancelledAt: null,
  isCancelled: false,
  attendance: 'enrolled',
  capacity: 30,
  registeredCount: 12,
  seatsRemaining: 18,
  isFull: false,
  registrationOpensAt: '2026-05-12T09:00:00.000Z',
  registrationClosesAt: '2026-05-31T09:00:00.000Z',
  registrationState: 'open',
  myRegistration: null,
  room: null,
  examiner: null,
  offering: { id: 'offering-1' },
  course: { id: 'course-1', code: 'INF/ALG/22', title: 'Algorithms' },
  term: { id: 'term-1', code: '2026-SS', name: 'Summer 2026' },
  provenance: {
    sourceSystem: 'sis',
    externalId: 'EXT-1',
    sourceUpdatedAt: null,
    lastSynchronizedAt: null,
    synchronizationStatus: 'in_sync',
  },
  ...overrides,
});

const NOW = new Date('2026-05-20T09:00:00.000Z');

describe('splitExamTerms', () => {
  it('puts an exam still to come under upcoming', () => {
    const { upcoming, past } = splitExamTerms([term()], NOW);

    expect(upcoming.map(entry => entry.id)).toEqual(['exam-1']);
    expect(past).toEqual([]);
  });

  it('puts an exam that has started under past', () => {
    const { upcoming, past } = splitExamTerms(
      [term({ startsAt: '2026-05-01T09:00:00.000Z' })],
      NOW,
    );

    expect(upcoming).toEqual([]);
    expect(past.map(entry => entry.id)).toEqual(['exam-1']);
  });

  it('counts an exam starting exactly now as still upcoming', () => {
    const { upcoming } = splitExamTerms([term({ startsAt: NOW.toISOString() })], NOW);

    expect(upcoming).toHaveLength(1);
  });

  it('orders what is coming soonest first and what is past most recent first', () => {
    const { upcoming, past } = splitExamTerms(
      [
        term({ id: 'later', startsAt: '2026-06-23T09:00:00.000Z' }),
        term({ id: 'sooner', startsAt: '2026-06-02T09:00:00.000Z' }),
        term({ id: 'long-ago', startsAt: '2026-02-01T09:00:00.000Z' }),
        term({ id: 'recent', startsAt: '2026-05-01T09:00:00.000Z' }),
      ],
      NOW,
    );

    expect(upcoming.map(entry => entry.id)).toEqual(['sooner', 'later']);
    expect(past.map(entry => entry.id)).toEqual(['recent', 'long-ago']);
  });

  it('has neither section for someone with no exams at all', () => {
    expect(splitExamTerms([], NOW)).toEqual({ upcoming: [], past: [] });
  });
});

describe('isRegistered', () => {
  it('is true only while the reader holds a live registration', () => {
    expect(isRegistered(term())).toBe(false);
    expect(
      isRegistered(
        term({
          myRegistration: {
            id: 'r1',
            status: 'registered',
            registeredAt: null,
            cancelledAt: null,
          },
        }),
      ),
    ).toBe(true);
  });

  it('is false once the reader has cancelled', () => {
    expect(
      isRegistered(
        term({
          myRegistration: {
            id: 'r1',
            status: 'cancelled',
            registeredAt: null,
            cancelledAt: '2026-05-15T00:00:00.000Z',
          },
        }),
      ),
    ).toBe(false);
  });
});

describe('examSeatsLabelKey', () => {
  it('names the free seats when the source recorded a capacity', () => {
    expect(examSeatsLabelKey(term())).toBe('seats');
  });

  it('says the exam is full rather than showing no seats left', () => {
    expect(examSeatsLabelKey(term({ seatsRemaining: 0, isFull: true }))).toBe(
      'seatsFull',
    );
  });

  it('admits the capacity is unknown rather than implying room', () => {
    expect(
      examSeatsLabelKey(term({ capacity: null, seatsRemaining: null, isFull: false })),
    ).toBe('seatsUnknown');
  });
});

describe('examRegistrationLabel', () => {
  it('names the day registration opens while it is still shut', () => {
    expect(examRegistrationLabel(term({ registrationState: 'not_open' }))).toEqual({
      key: 'opensOn',
      date: '2026-05-12T09:00:00.000Z',
    });
  });

  it('names the deadline while registration is open', () => {
    expect(examRegistrationLabel(term())).toEqual({
      key: 'closesOn',
      date: '2026-05-31T09:00:00.000Z',
    });
  });

  it('promises no deadline the source did not give', () => {
    expect(examRegistrationLabel(term({ registrationClosesAt: null }))).toEqual({
      key: 'openUntilFurtherNotice',
    });
  });

  it('says registration is shut for a closed or cancelled exam', () => {
    expect(examRegistrationLabel(term({ registrationState: 'closed' }))).toEqual({
      key: 'closedNow',
    });
  });

  it('falls back to the shut label when no opening date was imported', () => {
    expect(
      examRegistrationLabel(
        term({ registrationState: 'not_open', registrationOpensAt: null }),
      ),
    ).toEqual({ key: 'closedNow' });
  });
});
