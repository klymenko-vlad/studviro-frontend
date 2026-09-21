import { apiQueries, type PersonDirectoryEntryDto } from '@/shared/api';

/**
 * The endpoint used to answer with everybody. It is keyset-paginated now, so
 * there are two shapes here rather than one.
 *
 * `page` is the honest one: a page of people and the cursor to continue from.
 * Use it for anything that lists people, and for a typeahead, which passes `q`
 * so the filtering happens on the server.
 *
 * `listForInstitution` keeps the old array shape for callers that want "the
 * directory" and have not been given a way to page yet. It asks for the largest
 * page the server allows and unwraps it, so those screens behave as they did —
 * except that beyond 100 people they now see the first 100 rather than all of
 * them. **That is a real limit, not a formality**: `audit-trail` resolves actor
 * names against this list, so in an institution of more than 100 people some
 * rows will read "unknown actor". It needs its own fix — resolving the ids on
 * screen rather than downloading a directory to search in the browser — and
 * until it has one this wrapper is the smaller of two wrongs, the larger being
 * an endpoint with no limit at all.
 */
const WHOLE_DIRECTORY = 100;

export const personQueries = {
  page: apiQueries.listPeopleOptions,

  listForInstitution: (options: Parameters<typeof apiQueries.listPeopleOptions>[0]) => ({
    ...apiQueries.listPeopleOptions({
      ...options,
      query: { limit: WHOLE_DIRECTORY, ...options.query },
    }),
    select: (page: { items: PersonDirectoryEntryDto[] }): PersonDirectoryEntryDto[] =>
      page.items,
  }),

  listForInstitutionKey: apiQueries.listPeopleQueryKey,
} as const;
