import type { PersonalEventDto, PersonalTaskDto, PersonalTaskState } from '@/shared/api';

export type PersonalTask = PersonalTaskDto;
export type PersonalEvent = PersonalEventDto;
export type TaskState = PersonalTaskState;

export const TASK_STATES: readonly TaskState[] = ['open', 'done', 'all'];
