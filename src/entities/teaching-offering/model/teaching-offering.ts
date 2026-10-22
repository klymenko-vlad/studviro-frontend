import type { TeachingOfferingResponseDto } from '@/shared/api';

export type TeachingOffering = TeachingOfferingResponseDto;
export type TeachingOfferingTerm = TeachingOffering['term'];
export type TeachingRole = TeachingOffering['role'];

export interface TermTeachingOfferings {
  term: TeachingOfferingTerm;
  offerings: TeachingOffering[];
}

/**
 * The API already orders by term start descending, then course code; grouping
 * preserves that order rather than imposing a second one.
 */
export function groupTeachingByTerm(
  offerings: TeachingOffering[],
): TermTeachingOfferings[] {
  const groups: TermTeachingOfferings[] = [];

  for (const offering of offerings) {
    const current = groups.at(-1);

    if (current?.term.id === offering.term.id) current.offerings.push(offering);
    else groups.push({ term: offering.term, offerings: [offering] });
  }

  return groups;
}

export function totalEnrolled(offerings: TeachingOffering[]): number {
  return offerings.reduce((sum, offering) => sum + offering.enrolledCount, 0);
}
