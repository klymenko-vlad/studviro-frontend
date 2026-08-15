import { apiQueries } from '@/shared/api';

export const institutionConfigurationQueries = {
  detail: apiQueries.getInstitutionConfigurationOptions,
  detailKey: apiQueries.getInstitutionConfigurationQueryKey,
  connectors: apiQueries.listInstitutionConnectorsOptions,
  connectorsKey: apiQueries.listInstitutionConnectorsQueryKey,
} as const;

export const institutionConfigurationMutations = {
  update: apiQueries.updateInstitutionConfigurationMutation,
} as const;
