import type { Query } from '@tanstack/react-query';

import { apiQueries } from '@/shared/api';

const READS = new Set(['listMyTasks', 'listMyDueTasks', 'listMyPersonalEvents']);

export function isPlannerRead(query: Pick<Query, 'queryKey'>): boolean {
  const [head] = query.queryKey as [{ _id?: string } | undefined];

  return head?._id !== undefined && READS.has(head._id);
}

export const plannerQueries = {
  tasks: (options: Parameters<typeof apiQueries.listMyTasksInfiniteOptions>[0]) => ({
    ...apiQueries.listMyTasksInfiniteOptions(options),
    initialPageParam: '',
    getNextPageParam: (lastPage: { meta: { nextCursor: string | null } }) =>
      lastPage.meta.nextCursor ?? undefined,
  }),
  dueTasks: apiQueries.listMyDueTasksOptions,
  events: apiQueries.listMyPersonalEventsOptions,
} as const;

export const plannerMutations = {
  createTask: apiQueries.createMyTaskMutation,
  updateTask: apiQueries.updateMyTaskMutation,
  removeTask: apiQueries.deleteMyTaskMutation,
  createEvent: apiQueries.createMyPersonalEventMutation,
  updateEvent: apiQueries.updateMyPersonalEventMutation,
  removeEvent: apiQueries.deleteMyPersonalEventMutation,
} as const;
