import { apiQueries } from '@/shared/api';

export const offeringExamTermQueries = {
  list: apiQueries.listOfferingExamTermsOptions,
  listKey: apiQueries.listOfferingExamTermsQueryKey,
  registrants: apiQueries.listExamTermRegistrantsOptions,
  registrantsKey: apiQueries.listExamTermRegistrantsQueryKey,
} as const;

export const offeringExamTermMutations = {
  create: apiQueries.createExamTermMutation,
  update: apiQueries.updateExamTermMutation,
  cancel: apiQueries.cancelExamTermMutation,
  remove: apiQueries.removeExamTermMutation,
  recordAttendance: apiQueries.recordExamAttendanceMutation,
} as const;
