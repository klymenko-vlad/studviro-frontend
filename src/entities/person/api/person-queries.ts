import { apiQueries } from '@/shared/api';

export const personQueries = {
  listForInstitution: apiQueries.listPeopleOptions,
  listForInstitutionKey: apiQueries.listPeopleQueryKey,
} as const;
