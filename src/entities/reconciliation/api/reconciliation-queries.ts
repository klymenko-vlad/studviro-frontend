import { apiQueries } from '@/shared/api';

export const reconciliationQueries = {
  report: apiQueries.getSynchronizationReconciliationOptions,
  reportKey: apiQueries.getSynchronizationReconciliationQueryKey,
} as const;
