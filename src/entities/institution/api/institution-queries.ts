import { apiQueries } from '@/shared/api';

export const institutionQueries = {
  mine: apiQueries.listMyInstitutionsOptions,
  mineKey: apiQueries.listMyInstitutionsQueryKey,
  detail: apiQueries.getInstitutionOptions,
  detailKey: apiQueries.getInstitutionQueryKey,
} as const;
