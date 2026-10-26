import { z } from 'zod';

import { apiSchemas } from '@/shared/api';
import { fromLocalInput, toLocalInput } from '@/shared/lib';

const moment = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/u, 'Use a date and a time');
const optionalMoment = z.union([moment, z.literal('')]);
const title = apiSchemas.zCreatePersonalTaskDto.shape.title.refine(
  value => value.trim() !== '',
  'Required',
);
const note = z.string().max(2000);

export const taskFormSchema = z.object({ title, note, dueAt: optionalMoment });

export const eventFormSchema = z
  .object({
    title,
    note,
    location: z.string().max(200),
    startsAt: moment,
    endsAt: moment,
  })
  .refine(values => values.endsAt > values.startsAt, {
    path: ['endsAt'],
    message: 'An event ends after it starts',
  });

export type TaskFormValues = z.infer<typeof taskFormSchema>;
export type EventFormValues = z.infer<typeof eventFormSchema>;

export const EMPTY_TASK: TaskFormValues = { title: '', note: '', dueAt: '' };

const textOrNull = (value: string) => (value.trim() === '' ? null : value.trim());

export function toTaskPayload(values: TaskFormValues, timeZone: string) {
  return {
    title: values.title.trim(),
    note: textOrNull(values.note),
    dueAt: fromLocalInput(values.dueAt, timeZone),
  };
}

export function toTaskValues(
  task: { title: string; note: string | null; dueAt: string | null },
  timeZone: string,
): TaskFormValues {
  return {
    title: task.title,
    note: task.note ?? '',
    dueAt: toLocalInput(task.dueAt, timeZone),
  };
}

export function emptyEvent(startsAt: string, endsAt: string): EventFormValues {
  return { title: '', note: '', location: '', startsAt, endsAt };
}

export function toEventPayload(values: EventFormValues, timeZone: string) {
  return {
    title: values.title.trim(),
    note: textOrNull(values.note),
    location: textOrNull(values.location),
    startsAt: fromLocalInput(values.startsAt, timeZone) ?? '',
    endsAt: fromLocalInput(values.endsAt, timeZone) ?? '',
  };
}

export function toEventValues(
  event: {
    title: string;
    note: string | null;
    location: string | null;
    startsAt: string;
    endsAt: string;
  },
  timeZone: string,
): EventFormValues {
  return {
    title: event.title,
    note: event.note ?? '',
    location: event.location ?? '',
    startsAt: toLocalInput(event.startsAt, timeZone),
    endsAt: toLocalInput(event.endsAt, timeZone),
  };
}
