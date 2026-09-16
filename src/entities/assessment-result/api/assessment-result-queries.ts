import { apiQueries } from '@/shared/api';

export const assessmentResultQueries = {
  list: apiQueries.listMyAssessmentResultsOptions,
  listKey: apiQueries.listMyAssessmentResultsQueryKey,
} as const;
