'use client';

import { useQueryClient } from '@tanstack/react-query';

import { discussionQueries, type DiscussionAddress } from '@/entities/discussion';

/** Every change to a thread can move it in the list too, so both are refetched. */
export function useRefreshDiscussion(address: DiscussionAddress) {
  const queryClient = useQueryClient();

  return async (threadId?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: discussionQueries.threadsKey({ path: address }),
      }),
      threadId === undefined
        ? Promise.resolve()
        : queryClient.invalidateQueries({
            queryKey: discussionQueries.threadKey({ path: { ...address, threadId } }),
          }),
    ]);
  };
}
