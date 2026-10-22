import { apiQueries } from '@/shared/api';

/**
 * Three ways to ask about people, because there are three questions.
 *
 * `page` is one page, narrowed by `q` — what a typeahead wants, so the search
 * happens on the server rather than over a directory the browser had to
 * download first.
 *
 * `infinite` is the same thing behind a load-more. The generated options carry
 * the request; where the next page starts is this layer's to say, because only
 * it knows `meta.nextCursor` is the keyset and a null one means the end.
 *
 * `byIds` resolves names for ids a screen already holds — the audit trail
 * labels an actor this way. There used to be a fourth, which walked every page
 * and handed back the whole directory for exactly that caller; it is gone,
 * because fetching an institution to label a handful of rows is work
 * proportional to the wrong thing.
 */

/** The server's own cap on `userIds`, so a page of rows resolves in one request. */
const RESOLVE_LIMIT = 100;

type ListPeopleOptions = Parameters<typeof apiQueries.listPeopleOptions>[0];

interface PeoplePage {
  meta: { nextCursor: string | null };
}

export const personQueries = {
  page: apiQueries.listPeopleOptions,

  infinite: (options: ListPeopleOptions) => ({
    ...apiQueries.listPeopleInfiniteOptions(options),
    initialPageParam: '',
    getNextPageParam: (lastPage: PeoplePage): string | undefined =>
      lastPage.meta.nextCursor ?? undefined,
  }),

  /**
   * Sorted so the same set of ids is the same query key however the rows were
   * ordered, and a filter change that does not change the actors re-uses the
   * answer instead of asking again.
   */
  byIds: (institutionId: string, userIds: readonly string[]) =>
    apiQueries.listPeopleOptions({
      path: { institutionId },
      query: { userIds: [...userIds].toSorted(), limit: RESOLVE_LIMIT },
    }),

  listForInstitutionKey: apiQueries.listPeopleQueryKey,
} as const;
