import { apiQueries } from '@/shared/api';

type StudentsOptions = Parameters<
  typeof apiQueries.listLearningStudentViewStudentsInfiniteOptions
>[0];

interface StudentsPage {
  meta: { page: number; hasNextPage: boolean };
}

export const learningSpaceQueries = {
  list: apiQueries.listLearningSpacesOptions,
  listKey: apiQueries.listLearningSpacesQueryKey,
  studentView: apiQueries.getLearningStudentViewOptions,

  students: (options: StudentsOptions) => ({
    ...apiQueries.listLearningStudentViewStudentsInfiniteOptions(options),
    initialPageParam: 1,
    getNextPageParam: (lastPage: StudentsPage): number | undefined =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
  }),
} as const;

export const learningSpaceMutations = {
  create: apiQueries.createLearningSpaceMutation,
  update: apiQueries.updateLearningSpaceMutation,
} as const;
