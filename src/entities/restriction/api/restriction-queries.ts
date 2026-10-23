import { apiQueries } from '@/shared/api';

type SightOptions = Parameters<typeof apiQueries.listLearningItemSightInfiniteOptions>[0];

interface SightPage {
  meta: { page: number; hasNextPage: boolean };
}

export const restrictionQueries = {
  sight: (options: SightOptions) => ({
    ...apiQueries.listLearningItemSightInfiniteOptions(options),
    initialPageParam: 1,
    getNextPageParam: (lastPage: SightPage): number | undefined =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
  }),
  sightKey: apiQueries.listLearningItemSightInfiniteQueryKey,
} as const;
