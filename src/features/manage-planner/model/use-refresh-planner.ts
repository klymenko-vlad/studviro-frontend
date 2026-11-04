import { useQueryClient } from '@tanstack/react-query';

import { isPlannerRead } from '@/entities/planner';

export function useRefreshPlanner(): () => Promise<void> {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ predicate: isPlannerRead });
}
