import { describe, expect, it } from 'vitest';

import type { OfferingExamTerm } from '@/entities/offering-exam-term';

import {
  EMPTY_EXAM_TERM,
  examTermFormSchema,
  toExamTermPayload,
  toFormValues,
} from './schema';

const values = (overrides: Partial<typeof EMPTY_EXAM_TERM> = {}) => ({
  ...EMPTY_EXAM_TERM,
  date: '2026-12-15',
  ...overrides,
});

const issuesAt = (overrides: Partial<typeof EMPTY_EXAM_TERM>) => {
  const result = examTermFormSchema.safeParse(values(overrides));

  return result.success ? [] : result.error.issues.map(issue => issue.path.join('.'));
};

describe('examTermFormSchema', () => {
  it('accepts a term with no registration window, which then closes at the exam', () => {
    expect(issuesAt({})).toEqual([]);
  });

  it('refuses a window that opens only after the exam day', () => {
    expect(issuesAt({ opensOn: '2026-12-16' })).toEqual(['opensOn']);
  });

  it('refuses a window that closes after the exam day', () => {
    expect(issuesAt({ closesOn: '2026-12-16' })).toEqual(['closesOn']);
  });
});

describe('the institution’s clock (B31)', () => {
  const BRATISLAVA = 'Europe/Bratislava';

  it('stores what the registrar typed as the institution’s time, not UTC', () => {
    const payload = toExamTermPayload(
      values({
        from: '09:00',
        to: '11:00',
        opensOn: '2026-12-01',
        closesOn: '2026-12-14',
      }),
      BRATISLAVA,
    );

    expect(payload.startsAt).toBe('2026-12-15T08:00:00.000Z');
    expect(payload.endsAt).toBe('2026-12-15T10:00:00.000Z');
    expect(payload.registrationOpensAt).toBe('2026-11-30T23:00:00.000Z');
    expect(payload.registrationClosesAt).toBe('2026-12-13T23:00:00.000Z');
  });

  it('opens an existing term on the time it was entered at', () => {
    const term = {
      kind: 'regular',
      startsAt: '2026-12-15T08:00:00.000Z',
      endsAt: '2026-12-15T10:00:00.000Z',
      registrationOpensAt: '2026-11-30T23:00:00.000Z',
      registrationClosesAt: null,
      capacity: null,
      roomId: null,
      examinerId: null,
    } as unknown as OfferingExamTerm;

    expect(toFormValues(term, BRATISLAVA)).toMatchObject({
      date: '2026-12-15',
      from: '09:00',
      to: '11:00',
      opensOn: '2026-12-01',
    });
  });
});
