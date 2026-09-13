import { apiQueries } from '@/shared/api';

export const reconciliationQueries = {
  report: apiQueries.getSynchronizationReconciliationOptions,
  reportKey: apiQueries.getSynchronizationReconciliationQueryKey,
  resolutions: apiQueries.listReconciliationResolutionsOptions,
  resolutionsKey: apiQueries.listReconciliationResolutionsQueryKey,
} as const;

export const reconciliationMutations = {
  resolve: apiQueries.resolveReconciliationDiscrepancyMutation,
} as const;
