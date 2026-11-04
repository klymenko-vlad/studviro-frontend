import { apiQueries } from '@/shared/api';

type SourcesOptions = Parameters<
  typeof apiQueries.listCourseImportSourcesInfiniteOptions
>[0];

interface SourcesPage {
  meta: { page: number; hasNextPage: boolean };
}

export const importCourseQueries = {
  sources: (options: SourcesOptions) => ({
    ...apiQueries.listCourseImportSourcesInfiniteOptions(options),
    initialPageParam: 1,
    getNextPageParam: (lastPage: SourcesPage): number | undefined =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
  }),
  preview: apiQueries.previewCourseImportOptions,
  run: apiQueries.importCourseMutation,
} as const;
