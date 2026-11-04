import { isRegistered, splitExamTerms, type ExamTerm } from '@/entities/exam-term';

export type NextExam =
  | { kind: 'registered'; term: ExamTerm }
  | { kind: 'open'; count: number }
  | { kind: 'none' };

export function nextExam(terms: ExamTerm[], now: Date): NextExam {
  const upcoming = splitExamTerms(terms, now).upcoming.filter(term => !term.isCancelled);
  const booked = upcoming.find(isRegistered);

  if (booked !== undefined) return { kind: 'registered', term: booked };

  const open = upcoming.filter(term => term.registrationAvailability.canRegister).length;

  return open > 0 ? { kind: 'open', count: open } : { kind: 'none' };
}
