import { z } from 'zod';

import { apiSchemas } from '@/shared/api';

const time = z.string().regex(/^\d{2}:\d{2}$/u, 'Use a time like 09:00');

/**
 * The API takes two instants; a timetabling screen asks for a date and two
 * times, because that is how a slot is thought about. The three are combined
 * on submit.
 */
export const timetableFormSchema = apiSchemas.zCreateTimetableEventDto
  .omit({
    startsAt: true,
    endsAt: true,
    title: true,
    type: true,
    roomId: true,
    studyGroupId: true,
  })
  .extend({
    type: apiSchemas.zCreateTimetableEventDto.shape.type.unwrap(),
    title: z.string().max(200),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, 'Use a date'),
    from: time,
    to: time,
    roomId: z.string(),
    studyGroupId: z.string(),
    repeatWeekly: z.boolean(),
  })
  .refine(values => values.to > values.from, {
    path: ['to'],
    message: 'A class must end after it starts',
  });

export type TimetableFormValues = z.infer<typeof timetableFormSchema>;

export const TIMETABLE_EVENT_TYPES =
  apiSchemas.zCreateTimetableEventDto.shape.type.unwrap().options;

export function toCreatePayload(values: TimetableFormValues) {
  return {
    type: values.type,
    title: values.title === '' ? null : values.title,
    startsAt: `${values.date}T${values.from}:00.000Z`,
    endsAt: `${values.date}T${values.to}:00.000Z`,
    roomId: values.roomId === '' ? null : values.roomId,
    studyGroupId: values.studyGroupId === '' ? null : values.studyGroupId,
    repeatWeekly: values.repeatWeekly,
  };
}
