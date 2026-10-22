import type { ExamTerm } from './exam-term';

export type ExamRegistrationReason = ExamTerm['registrationAvailability']['reason'];

/**
 * The server's own answer, not a second copy of the registration rules: a term is
 * actionable when the caller may take its seat or give up the one they hold.
 */
export function canActOnExamTerm(term: ExamTerm): boolean {
  return (
    term.registrationAvailability.canRegister || term.registrationAvailability.canCancel
  );
}

export function actionableExamTerms(terms: ExamTerm[]): ExamTerm[] {
  return terms.filter(canActOnExamTerm);
}

const UNSPOKEN: ExamRegistrationReason[] = ['open', 'registered', 'not_open', 'closed'];

/**
 * `not_open` and `closed` are already spelled out by the registration window beside the
 * button and `registered` by the badge above it; the rest are the reasons nothing else on
 * the card would explain.
 */
export function examTermBlockedNote(term: ExamTerm): ExamRegistrationReason | null {
  const { reason } = term.registrationAvailability;

  return UNSPOKEN.includes(reason) ? null : reason;
}
