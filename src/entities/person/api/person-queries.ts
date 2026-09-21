import { queryOptions } from '@tanstack/react-query';

import { apiQueries, type PersonDirectoryEntryDto } from '@/shared/api';

/**
 * The endpoint answers with a page now, so there are two shapes here.
 *
 * `page` is the one to reach for: a page of people plus the cursor to continue
 * from, and `q` for a typeahead that filters on the server. Anything that lists
 * people should use it, with `apiQueries.listPeopleInfiniteOptions` behind a
 * load-more.
 *
 * `listForInstitution` is for the callers that genuinely need *everybody* — the
 * audit trail resolves an actor id against it, and a name it cannot find reads
 * as "unknown actor" to somebody auditing their own institution. It walks the
 * cursor to the end and hands back one array, so those screens are correct
 * rather than quietly truncated at the first page.
 *
 * That is deliberately not the same thing as the old behaviour: the request is
 * bounded at 100 rows now, and walking is the caller's cost rather than the
 * server's. It is still a directory download, which is the wrong shape for
 * resolving a handful of ids — the audit trail wants an endpoint that resolves
 * the ids on screen. Until it has one, correct and chatty beats fast and wrong.
 */
const PAGE_SIZE = 100;

/**
 * A ceiling, not a limit: without it a cursor bug becomes an infinite loop in
 * the browser rather than a failed request. Fifty pages is 5,000 people.
 */
const MAX_PAGES = 50;

interface PeoplePage {
  items: PersonDirectoryEntryDto[];
  meta: { limit: number; hasNextPage: boolean; nextCursor: string | null };
}

type ListPeopleOptions = Parameters<typeof apiQueries.listPeopleOptions>[0];

async function fetchEveryone(
  institutionId: string,
  signal: AbortSignal | undefined,
): Promise<PersonDirectoryEntryDto[]> {
  const everyone: PersonDirectoryEntryDto[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const query = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (cursor !== null) query.set('cursor', cursor);

    const response = await fetch(
      `/api/proxy/api/v1/institutions/${institutionId}/people?${query.toString()}`,
      { signal, credentials: 'same-origin' },
    );
    if (!response.ok) throw new Error('The people of this institution could not be read');

    const body = (await response.json()) as PeoplePage;
    everyone.push(...body.items);

    cursor = body.meta.nextCursor;
    if (cursor === null) break;
  }

  return everyone;
}

export const personQueries = {
  page: apiQueries.listPeopleOptions,

  /**
   * The directory behind a load-more. The generated options carry the request;
   * where the next page starts is ours to say, because only this layer knows
   * that `meta.nextCursor` is the keyset and that a null one means the end.
   */
  infinite: (options: ListPeopleOptions) => ({
    ...apiQueries.listPeopleInfiniteOptions(options),
    initialPageParam: '',
    getNextPageParam: (lastPage: PeoplePage): string | undefined =>
      lastPage.meta.nextCursor ?? undefined,
  }),

  listForInstitution: (options: ListPeopleOptions) =>
    queryOptions({
      queryKey: apiQueries.listPeopleQueryKey(options),
      queryFn: ({ signal }) => fetchEveryone(options.path.institutionId, signal),
    }),

  listForInstitutionKey: apiQueries.listPeopleQueryKey,
} as const;
