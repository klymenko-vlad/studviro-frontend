import { describe, expect, it } from 'vitest';

import type { ExamTerm } from './exam-term';
import {
  actionableExamTerms,
  canActOnExamTerm,
  examTermBlockedNote,
} from './exam-term-filter';

const term = (
  availability: Partial<ExamTerm['registrationAvailability']> = {},
  id = 'exam-1',
): ExamTerm =>
  ({
    id,
    registrationAvailability: {
      canRegister: false,
      canCancel: false,
      reason: 'closed',
      ...availability,
    },
  }) as ExamTerm;

describe('canActOnExamTerm', () => {
  it('takes a free seat the caller may register for', () => {
    expect(canActOnExamTerm(term({ canRegister: true, reason: 'open' }))).toBe(true);
  });

  it('takes a held seat the caller may still give up', () => {
    expect(canActOnExamTerm(term({ canCancel: true, reason: 'registered' }))).toBe(true);
  });

  it('leaves a term the caller can neither take nor release', () => {
    expect(canActOnExamTerm(term())).toBe(false);
  });
});

describe('actionableExamTerms', () => {
  it('keeps only the terms the server says the caller may act on', () => {
    const terms = [
      term({ canRegister: true, reason: 'open' }, 'open'),
      term({ reason: 'full' }, 'full'),
      term({ canCancel: true, reason: 'registered' }, 'held'),
    ];

    expect(actionableExamTerms(terms).map(t => t.id)).toEqual(['open', 'held']);
  });

  it('returns nothing rather than everything when no term is actionable', () => {
    expect(actionableExamTerms([term(), term({}, 'exam-2')])).toEqual([]);
  });
});

describe('examTermBlockedNote', () => {
  it('names the reasons nothing else on the card explains', () => {
    expect(examTermBlockedNote(term({ reason: 'other_term_registered' }))).toBe(
      'other_term_registered',
    );
    expect(examTermBlockedNote(term({ reason: 'full' }))).toBe('full');
    expect(examTermBlockedNote(term({ reason: 'teaching' }))).toBe('teaching');
    expect(examTermBlockedNote(term({ reason: 'cancelled' }))).toBe('cancelled');
  });

  it('stays quiet where the window label already says it', () => {
    expect(examTermBlockedNote(term({ reason: 'not_open' }))).toBeNull();
    expect(examTermBlockedNote(term({ reason: 'closed' }))).toBeNull();
  });

  it('stays quiet when the caller holds the seat, which the badge already says', () => {
    expect(
      examTermBlockedNote(term({ canCancel: true, reason: 'registered' })),
    ).toBeNull();
  });

  it('stays quiet when nothing is blocked', () => {
    expect(examTermBlockedNote(term({ canRegister: true, reason: 'open' }))).toBeNull();
  });
});
