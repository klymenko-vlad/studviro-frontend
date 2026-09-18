import { apiQueries } from '@/shared/api';

export const courseResultQueries = {
  summary: apiQueries.getMyStudyProgressOptions,
  summaryKey: apiQueries.getMyStudyProgressQueryKey,
  list: apiQueries.listMyCourseResultsOptions,
  listKey: apiQueries.listMyCourseResultsQueryKey,
} as const;
