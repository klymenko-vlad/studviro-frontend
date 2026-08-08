import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query';

import { QUERY_STALE_TIME } from '@/shared/config';

import { toApiError } from './error';

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        /**
         * With Server Components, data is already fetched on the server before
         * the client mounts. A zero stale time would make the client refetch
         * everything immediately on hydration, doubling every request.
         */
        staleTime: QUERY_STALE_TIME,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          const apiError = toApiError(error);
          // A 400 or 404 will fail identically every time; only transport
          // failures and 5xx are worth another attempt.
          if (apiError.isClientError) return false;
          return failureCount < 2;
        },
        retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30_000),
      },
      mutations: {
        // Mutations are not idempotent — a blind retry can double-charge someone.
        retry: false,
      },
      dehydrate: {
        // Lets the server stream a query that is still in flight instead of
        // blocking the response until it settles.
        shouldDehydrateQuery: query =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * One client per request on the server, one shared client in the browser.
 *
 * Sharing a client across server requests would leak one user's cached data into
 * another user's response; recreating it on every browser render would throw away
 * the cache on each suspension.
 */
export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
