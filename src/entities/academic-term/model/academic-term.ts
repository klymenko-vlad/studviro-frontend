import type { AcademicTermResponseDto } from '@/shared/api';

export type AcademicTerm = AcademicTermResponseDto;

export type EnrollmentWindowState = 'none' | 'upcoming' | 'open' | 'closed';

/**
 * A term with no window never opens for self-service enrolment, which is a
 * different thing from one whose window has passed — the screen has to say
 * which, or an administrator cannot tell a deliberate choice from an omission.
 */
export function enrollmentWindowState(
  term: Pick<AcademicTerm, 'enrollmentOpensAt' | 'enrollmentClosesAt'>,
  now: Date = new Date(),
): EnrollmentWindowState {
  if (!term.enrollmentOpensAt && !term.enrollmentClosesAt) return 'none';

  const opens = term.enrollmentOpensAt ? new Date(term.enrollmentOpensAt) : null;
  const closes = term.enrollmentClosesAt ? new Date(term.enrollmentClosesAt) : null;

  if (opens && now < opens) return 'upcoming';
  if (closes && now > closes) return 'closed';

  return 'open';
}
