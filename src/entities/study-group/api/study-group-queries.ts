import { apiQueries } from '@/shared/api';

export const studyGroupQueries = {
  list: apiQueries.listStudyGroupsOptions,
  listKey: apiQueries.listStudyGroupsQueryKey,
} as const;

export const studyGroupMutations = {
  create: apiQueries.createStudyGroupMutation,
  update: apiQueries.updateStudyGroupMutation,
  remove: apiQueries.removeStudyGroupMutation,
  addMember: apiQueries.addStudyGroupMemberMutation,
  removeMember: apiQueries.removeStudyGroupMemberMutation,
} as const;
