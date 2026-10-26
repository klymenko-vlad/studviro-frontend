import { useQuery } from '@tanstack/react-query';

import { plannerQueries } from '@/entities/planner';

import type { PersonalLayer } from './calendar-items';

export function usePersonalLayer(
  institutionId: string,
  range: { from: string; to: string },
  enabled: boolean,
): PersonalLayer | undefined {
  const events = useQuery({
    ...plannerQueries.events({ path: { institutionId }, query: range }),
    enabled,
  });
  const tasks = useQuery({
    ...plannerQueries.dueTasks({ path: { institutionId }, query: range }),
    enabled,
  });

  if (!enabled) return undefined;

  return { events: events.data ?? [], tasks: tasks.data ?? [] };
}
