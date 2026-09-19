import { apiQueries } from '@/shared/api';

export const academicTermQueries = {
  list: apiQueries.listAcademicTermsOptions,
  listKey: apiQueries.listAcademicTermsQueryKey,
} as const;

export const academicTermMutations = {
  create: apiQueries.createAcademicTermMutation,
  update: apiQueries.updateAcademicTermMutation,
  remove: apiQueries.removeAcademicTermMutation,
} as const;
