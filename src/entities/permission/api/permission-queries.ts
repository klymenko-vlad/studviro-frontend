import { apiQueries } from '@/shared/api';

export const permissionQueries = {
  inInstitution: apiQueries.listMyPermissionsOptions,
  inInstitutionKey: apiQueries.listMyPermissionsQueryKey,
} as const;
