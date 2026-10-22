import type { MyExamTermResponseDto } from '@/shared/api';

export type ExamTerm = MyExamTermResponseDto;
export type ExamTermKind = ExamTerm['kind'];
export type ExamRegistrationState = ExamTerm['registrationState'];

export interface ExamTermSplit {
  upcoming: ExamTerm[];
  past: ExamTerm[];
}

export function splitExamTerms(terms: ExamTerm[], now: Date): ExamTermSplit {
  const sorted = [...terms].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const upcoming = sorted.filter(term => new Date(term.startsAt) >= now);
  const past = sorted.filter(term => new Date(term.startsAt) < now).reverse();

  return { upcoming, past };
}

export function isRegistered(term: ExamTerm): boolean {
  return term.myRegistration?.status === 'registered';
}

export function examSeatsLabelKey(
  term: ExamTerm,
): 'seatsUnknown' | 'seatsFull' | 'seats' {
  if (term.seatsRemaining === null) return 'seatsUnknown';

  return term.isFull ? 'seatsFull' : 'seats';
}

export type ExamRegistrationLabel =
  | { key: 'opensOn'; date: string }
  | { key: 'closesOn'; date: string }
  | { key: 'closedNow' };

export function examRegistrationLabel(term: ExamTerm): ExamRegistrationLabel {
  if (term.registrationState === 'not_open' && term.registrationOpensAt !== null)
    return { key: 'opensOn', date: term.registrationOpensAt };

  if (term.registrationState === 'open')
    return { key: 'closesOn', date: term.registrationClosesAt ?? term.startsAt };

  return { key: 'closedNow' };
}
