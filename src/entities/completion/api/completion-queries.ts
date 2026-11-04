import type { QueryClient } from '@tanstack/react-query';

import { apiQueries } from '@/shared/api';

type ReportOptions = Parameters<
  typeof apiQueries.listLearningCompletionsInfiniteOptions
>[0];

interface ReportPage {
  meta: { page: number; hasNextPage: boolean };
}

export const completionQueries = {
  myProgress: apiQueries.getMyLearningProgressOptions,
  myProgressKey: apiQueries.getMyLearningProgressQueryKey,

  report: (options: ReportOptions) => ({
    ...apiQueries.listLearningCompletionsInfiniteOptions(options),
    initialPageParam: 1,
    getNextPageParam: (lastPage: ReportPage): number | undefined =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
  }),
} as const;

export const completionMutations = {
  markDone: apiQueries.markLearningItemDoneMutation,
  recordView: apiQueries.recordLearningMaterialViewMutation,
} as const;

export function invalidateMyProgress(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({
    predicate: query =>
      (query.queryKey[0] as { _id?: string } | undefined)?._id ===
      'getMyLearningProgress',
  });
}
