import { apiQueries } from '@/shared/api';

export const assignmentQueries = {
  list: apiQueries.listAssignmentsOptions,
  listKey: apiQueries.listAssignmentsQueryKey,
} as const;

export const assignmentMutations = {
  create: apiQueries.createAssignmentMutation,
  update: apiQueries.updateAssignmentMutation,
  remove: apiQueries.removeAssignmentMutation,
} as const;
