import type { EnrollableOfferingResponseDto } from '@/shared/api';

export type EnrollableOffering = EnrollableOfferingResponseDto;
export type EnrollmentReason = EnrollableOffering['availability']['reason'];

/** The reasons the card does not already explain some other way. */
const UNSPOKEN: EnrollmentReason[] = ['open', 'not_open', 'closed'];

export function enrollmentBlockedNote(
  offering: EnrollableOffering,
): EnrollmentReason | null {
  const { reason } = offering.availability;

  return UNSPOKEN.includes(reason) ? null : reason;
}

export function canActOnOffering(offering: EnrollableOffering): boolean {
  return offering.availability.canEnroll || offering.availability.canWithdraw;
}

export function actionableOfferings(
  offerings: EnrollableOffering[],
): EnrollableOffering[] {
  return offerings.filter(canActOnOffering);
}

export function seatsLabelKey(
  offering: EnrollableOffering,
): 'seatsUnknown' | 'seatsFull' | 'seats' {
  if (offering.seatsRemaining === null) return 'seatsUnknown';

  return offering.isFull ? 'seatsFull' : 'seats';
}
