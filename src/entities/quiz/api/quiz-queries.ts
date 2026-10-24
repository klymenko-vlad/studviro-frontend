import { apiQueries } from '@/shared/api';

type SlotsOptions = Parameters<typeof apiQueries.listQuizSlotsInfiniteOptions>[0];

interface Paged {
  meta: { page: number; hasNextPage: boolean };
}

export const nextPage = (lastPage: Paged): number | undefined =>
  lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined;

export const quizQueries = {
  list: apiQueries.listQuizzesOptions,
  listKey: apiQueries.listQuizzesQueryKey,
  detail: apiQueries.getQuizOptions,
  detailKey: apiQueries.getQuizQueryKey,
  slots: (options: SlotsOptions) => ({
    ...apiQueries.listQuizSlotsInfiniteOptions(options),
    initialPageParam: 1,
    getNextPageParam: nextPage,
  }),
  slotsKey: apiQueries.listQuizSlotsInfiniteQueryKey,
} as const;

export const quizMutations = {
  create: apiQueries.createQuizMutation,
  update: apiQueries.updateQuizMutation,
  remove: apiQueries.removeQuizMutation,
  addSlots: apiQueries.addQuizSlotsMutation,
  updateSlot: apiQueries.updateQuizSlotMutation,
  removeSlot: apiQueries.removeQuizSlotMutation,
} as const;
