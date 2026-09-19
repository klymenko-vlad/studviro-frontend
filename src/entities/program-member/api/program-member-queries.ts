import { apiQueries } from '@/shared/api';

export const programMemberQueries = {
  list: apiQueries.listProgramMembersOptions,
  listKey: apiQueries.listProgramMembersQueryKey,
} as const;

export const programMemberMutations = {
  admit: apiQueries.admitToProgramMutation,
  update: apiQueries.updateProgramMembershipMutation,
  remove: apiQueries.removeProgramMembershipMutation,
} as const;
