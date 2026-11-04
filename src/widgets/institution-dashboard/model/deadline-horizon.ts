import { addDays } from '@/entities/timetable-event';

const HORIZON_DAYS = 14;

export function deadlineHorizon(now: Date): { from: string; to: string } {
  return { from: now.toISOString(), to: addDays(now, HORIZON_DAYS).toISOString() };
}
