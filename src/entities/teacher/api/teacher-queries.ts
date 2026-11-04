import { apiQueries } from '@/shared/api';

type ListTeacherOfferingsOptions = Parameters<
  typeof apiQueries.listTeacherOfferingsInfiniteOptions
>[0];

interface OfferingsPage {
  meta: { nextCursor: string | null };
}

export const teacherQueries = {
  profile: apiQueries.getTeacherProfileOptions,

  offerings: (options: ListTeacherOfferingsOptions) => ({
    ...apiQueries.listTeacherOfferingsInfiniteOptions(options),
    initialPageParam: '',
    getNextPageParam: (lastPage: OfferingsPage): string | undefined =>
      lastPage.meta.nextCursor ?? undefined,
  }),
} as const;
