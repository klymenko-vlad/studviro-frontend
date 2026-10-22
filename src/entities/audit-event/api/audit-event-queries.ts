import { apiQueries } from '@/shared/api';

export const auditEventQueries = {
  list: apiQueries.listAuditEventsOptions,
  listKey: apiQueries.listAuditEventsQueryKey,
} as const;
