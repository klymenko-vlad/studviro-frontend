import type { SearchHitDto, SearchResultsDto } from '@/shared/api';

export type SearchHit = SearchHitDto;
export type SearchResults = SearchResultsDto;
export type SearchHitKind = SearchHit['kind'];

/** The server will not answer a query shorter than this, so neither do we. */
export const MIN_QUERY = 2;

/**
 * Grouped in the order somebody scanning results expects: the thing they are
 * most likely looking for first. Kinds with no hits are dropped rather than
 * rendered empty.
 */
const ORDER: SearchHitKind[] = [
  'offering',
  'course',
  'program',
  'person',
  'orgUnit',
  'room',
];

export function byKind(
  hits: readonly SearchHit[],
): { kind: SearchHitKind; hits: SearchHit[] }[] {
  return ORDER.map(kind => ({
    kind,
    hits: hits.filter(hit => hit.kind === kind),
  })).filter(group => group.hits.length > 0);
}

/**
 * Where a hit goes. A course or an org unit has no page of its own yet, so
 * those land on the screen that lists them rather than nowhere — a result
 * that cannot be clicked is a result that wasted the reader's time.
 */
export function hrefFor(
  hit: SearchHit,
  routes: {
    courseOffering: (id: string) => string;
    program: (id: string) => string;
    catalogue: string;
    orgUnits: string;
    people: string;
  },
): string {
  switch (hit.kind) {
    case 'offering':
      return routes.courseOffering(hit.offeringId ?? hit.id);
    case 'program':
      return routes.program(hit.programId ?? hit.id);
    case 'person':
      return routes.people;
    case 'orgUnit':
    case 'room':
      return routes.orgUnits;
    case 'course':
      return routes.catalogue;
  }
}
