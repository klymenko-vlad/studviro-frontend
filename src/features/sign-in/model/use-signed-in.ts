import { useQueryClient } from '@tanstack/react-query';

import { LANDING_ROUTE, useRouter } from '@/shared/config';

/**
 * `push` before `refresh`, and both are needed. The session cookies were set by
 * the response just received, so every cached RSC payload — including the root
 * layout that renders the header — was produced while signed out. Refreshing
 * first only invalidates the route being left; the destination still renders
 * from the stale cache and shows a signed-out header to someone who has just
 * signed in.
 */
export function useSignedIn(next: string | undefined) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return () => {
    void queryClient.resetQueries();
    router.push(next ?? LANDING_ROUTE);
    router.refresh();
  };
}
