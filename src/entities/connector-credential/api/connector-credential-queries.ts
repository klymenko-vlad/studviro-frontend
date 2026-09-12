import { apiQueries } from '@/shared/api';

export const connectorCredentialsQueries = {
  detail: apiQueries.getInstitutionConnectorCredentialsOptions,
  detailKey: apiQueries.getInstitutionConnectorCredentialsQueryKey,
} as const;

export const connectorCredentialsMutations = {
  set: apiQueries.setInstitutionConnectorCredentialsMutation,
  clear: apiQueries.clearInstitutionConnectorCredentialMutation,
} as const;
