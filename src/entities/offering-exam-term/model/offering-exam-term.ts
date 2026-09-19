import type { ExamTermAdminResponseDto } from '@/shared/api';

export type OfferingExamTerm = ExamTermAdminResponseDto;

export function isCancelled(term: OfferingExamTerm): boolean {
  return term.cancelledAt !== null;
}

/** The seats left, or null when the term holds as many as turn up. */
export function seatsLeft(term: OfferingExamTerm): number | null {
  return term.capacity === null ? null : Math.max(0, term.capacity - term.seatsTaken);
}
