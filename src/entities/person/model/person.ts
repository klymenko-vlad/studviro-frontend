import type { PersonDirectoryEntryDto } from '@/shared/api';

export type Person = PersonDirectoryEntryDto;

/**
 * Name and email address both, because a directory has more than one Jana
 * Nováková and the address is what tells them apart. Every term has to match
 * somewhere, so "nov ja" finds her in either order.
 */
export function matchPeople(people: Person[], query: string): Person[] {
  const terms = query.toLowerCase().split(/\s+/u).filter(Boolean);
  if (terms.length === 0) return people;

  return people.filter(person => {
    const haystack = `${person.displayName} ${person.email}`.toLowerCase();

    return terms.every(term => haystack.includes(term));
  });
}
