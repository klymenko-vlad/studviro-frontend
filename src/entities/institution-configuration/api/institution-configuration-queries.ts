import { apiQueries } from '@/shared/api';

export const institutionConfigurationQueries = {
  detail: apiQueries.getInstitutionConfigurationOptions,
  detailKey: apiQueries.getInstitutionConfigurationQueryKey,
} as const;

export const institutionConfigurationMutations = {
  update: apiQueries.updateInstitutionConfigurationMutation,
} as const;
