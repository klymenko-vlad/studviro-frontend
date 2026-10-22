import { z } from 'zod';

import type { OfferingExamTerm } from '@/entities/offering-exam-term';
import { apiSchemas } from '@/shared/api';
import { toWallTime, wallTimeToInstant } from '@/shared/lib';

const time = z.string().regex(/^\d{2}:\d{2}$/u, 'Use a time like 09:00');
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, 'Use a date');
const optionalDay = z.union([day, z.literal('')]);

/**
 * The API takes instants; a term is thought about as a day, two times and a
 * registration window in whole days. The parts are combined on submit, the
 * same way the timetable form does it.
 */
export const examTermFormSchema = apiSchemas.zCreateExamTermDto
  .omit({
    kind: true,
    startsAt: true,
    endsAt: true,
    capacity: true,
    registrationOpensAt: true,
    registrationClosesAt: true,
    roomId: true,
    examinerId: true,
  })
  .extend({
    kind: apiSchemas.zCreateExamTermDto.shape.kind.unwrap(),
    date: day,
    from: time,
    to: time,
    capacity: z.string().regex(/^\d*$/u, 'Use a whole number of seats'),
    opensOn: optionalDay,
    closesOn: optionalDay,
    roomId: z.string(),
    examinerId: z.string(),
  })
  .refine(values => values.to > values.from, {
    path: ['to'],
    message: 'An exam must end after it starts',
  })
  .refine(
    values =>
      values.opensOn === '' || values.closesOn === '' || values.closesOn > values.opensOn,
    { path: ['closesOn'], message: 'Registration must close after it opens' },
  )
  .refine(values => values.opensOn === '' || values.opensOn <= values.date, {
    path: ['opensOn'],
    message: 'Registration must open before the exam starts',
  })
  .refine(values => values.closesOn === '' || values.closesOn <= values.date, {
    path: ['closesOn'],
    message: 'Registration must close before the exam starts',
  });

export type ExamTermFormValues = z.infer<typeof examTermFormSchema>;

export const EXAM_TERM_KINDS = apiSchemas.zCreateExamTermDto.shape.kind.unwrap().options;

export const EMPTY_EXAM_TERM: ExamTermFormValues = {
  kind: 'regular',
  date: '',
  from: '09:00',
  to: '11:00',
  capacity: '',
  opensOn: '',
  closesOn: '',
  roomId: '',
  examinerId: '',
};

export function toFormValues(
  term: OfferingExamTerm,
  timeZone: string,
): ExamTermFormValues {
  const starts = toWallTime(term.startsAt, timeZone);
  const dayOf = (iso: string | null) =>
    iso === null ? '' : toWallTime(iso, timeZone).date;

  return {
    kind: term.kind,
    date: starts.date,
    from: starts.time,
    to: toWallTime(term.endsAt ?? term.startsAt, timeZone).time,
    capacity: term.capacity === null ? '' : String(term.capacity),
    opensOn: dayOf(term.registrationOpensAt),
    closesOn: dayOf(term.registrationClosesAt),
    roomId: term.roomId ?? '',
    examinerId: term.examinerId ?? '',
  };
}

export function toExamTermPayload(values: ExamTermFormValues, timeZone: string) {
  const startOfDay = (day: string) =>
    day === '' ? null : wallTimeToInstant(day, '00:00', timeZone);

  return {
    kind: values.kind,
    startsAt: wallTimeToInstant(values.date, values.from, timeZone),
    endsAt: wallTimeToInstant(values.date, values.to, timeZone),
    capacity: values.capacity === '' ? null : Number(values.capacity),
    registrationOpensAt: startOfDay(values.opensOn),
    registrationClosesAt: startOfDay(values.closesOn),
    roomId: values.roomId === '' ? null : values.roomId,
    examinerId: values.examinerId === '' ? null : values.examinerId,
  };
}
