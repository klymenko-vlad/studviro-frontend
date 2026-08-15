import { apiQueries } from '@/shared/api';

export const roleAssignmentQueries = {
  mine: apiQueries.listMyRolesOptions,
  mineKey: apiQueries.listMyRolesQueryKey,
  listForInstitution: apiQueries.listRoleAssignmentsOptions,
  listForInstitutionKey: apiQueries.listRoleAssignmentsQueryKey,
} as const;

export const roleAssignmentMutations = {
  grant: apiQueries.grantRoleMutation,
  revoke: apiQueries.revokeRoleMutation,
} as const;
