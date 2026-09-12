import { apiQueries } from '@/shared/api';

export const orgUnitQueries = {
  listForInstitution: apiQueries.listOrgUnitsOptions,
  listForInstitutionKey: apiQueries.listOrgUnitsQueryKey,
  detail: apiQueries.getOrgUnitOptions,
  detailKey: apiQueries.getOrgUnitQueryKey,
} as const;
