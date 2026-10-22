import { apiQueries } from '@/shared/api';

export const teachingAssignmentQueries = {
  list: apiQueries.listTeachingAssignmentsOptions,
  listKey: apiQueries.listTeachingAssignmentsQueryKey,
} as const;

export const teachingAssignmentMutations = {
  assign: apiQueries.assignTeacherMutation,
  unassign: apiQueries.unassignTeacherMutation,
} as const;
