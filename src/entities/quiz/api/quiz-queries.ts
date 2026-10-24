import { apiQueries } from '@/shared/api';

type SlotsOptions = Parameters<typeof apiQueries.listQuizSlotsInfiniteOptions>[0];
type MyAttemptsOptions = Parameters<
  typeof apiQueries.listMyQuizAttemptsInfiniteOptions
>[0];
type AttemptsOptions = Parameters<typeof apiQueries.listQuizAttemptsInfiniteOptions>[0];

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
  myAttempts: (options: MyAttemptsOptions) => ({
    ...apiQueries.listMyQuizAttemptsInfiniteOptions(options),
    initialPageParam: 1,
    getNextPageParam: nextPage,
  }),
  myAttemptsKey: apiQueries.listMyQuizAttemptsInfiniteQueryKey,
  attempts: (options: AttemptsOptions) => ({
    ...apiQueries.listQuizAttemptsInfiniteOptions(options),
    initialPageParam: 1,
    getNextPageParam: nextPage,
  }),
  attempt: apiQueries.getQuizAttemptOptions,
  attemptKey: apiQueries.getQuizAttemptQueryKey,
} as const;

export const quizMutations = {
  create: apiQueries.createQuizMutation,
  update: apiQueries.updateQuizMutation,
  remove: apiQueries.removeQuizMutation,
  addSlots: apiQueries.addQuizSlotsMutation,
  updateSlot: apiQueries.updateQuizSlotMutation,
  removeSlot: apiQueries.removeQuizSlotMutation,
  startAttempt: apiQueries.startQuizAttemptMutation,
  saveAnswer: apiQueries.saveQuizAnswerMutation,
  submitAttempt: apiQueries.submitQuizAttemptMutation,
} as const;
