import { apiQueries } from '@/shared/api';

type CategoriesOptions = Parameters<
  typeof apiQueries.listQuestionCategoriesInfiniteOptions
>[0];
type QuestionsOptions = Parameters<typeof apiQueries.listQuestionsInfiniteOptions>[0];

interface Paged {
  meta: { page: number; hasNextPage: boolean };
}

const nextPage = (lastPage: Paged): number | undefined =>
  lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined;

export const questionBankQueries = {
  categories: (options: CategoriesOptions) => ({
    ...apiQueries.listQuestionCategoriesInfiniteOptions(options),
    initialPageParam: 1,
    getNextPageParam: nextPage,
  }),
  categoriesKey: apiQueries.listQuestionCategoriesInfiniteQueryKey,
  questions: (options: QuestionsOptions) => ({
    ...apiQueries.listQuestionsInfiniteOptions(options),
    initialPageParam: 1,
    getNextPageParam: nextPage,
  }),
  questionsKey: apiQueries.listQuestionsInfiniteQueryKey,
  question: apiQueries.getQuestionOptions,
  questionKey: apiQueries.getQuestionQueryKey,
} as const;

export const questionBankMutations = {
  createCategory: apiQueries.createQuestionCategoryMutation,
  renameCategory: apiQueries.renameQuestionCategoryMutation,
  removeCategory: apiQueries.removeQuestionCategoryMutation,
  createQuestion: apiQueries.createQuestionMutation,
  reviseQuestion: apiQueries.reviseQuestionMutation,
  removeQuestion: apiQueries.removeQuestionMutation,
} as const;
