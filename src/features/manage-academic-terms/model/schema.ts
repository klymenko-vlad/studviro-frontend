import { z } from 'zod';

import { apiSchemas } from '@/shared/api';

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, 'Use a date');
const optionalDay = z.union([day, z.literal('')]);

/**
 * The API takes instants; a `<input type="date">` gives a calendar day. The
 * form validates the fields the API constrains against the API's own schema and
 * only replaces the four it cannot express as a day.
 */
export const academicTermFormSchema = apiSchemas.zCreateAcademicTermDto
  .omit({
    startsAt: true,
    endsAt: true,
    enrollmentOpensAt: true,
    enrollmentClosesAt: true,
  })
  .extend({
    startsAt: day,
    endsAt: day,
    enrollmentOpensAt: optionalDay,
    enrollmentClosesAt: optionalDay,
  })
  .refine(values => values.endsAt > values.startsAt, {
    path: ['endsAt'],
    message: 'A term must end after it starts',
  })
  .refine(
    values =>
      values.enrollmentOpensAt === '' ||
      values.enrollmentClosesAt === '' ||
      values.enrollmentClosesAt > values.enrollmentOpensAt,
    { path: ['enrollmentClosesAt'], message: 'Enrolment must close after it opens' },
  );

export type AcademicTermFormValues = z.infer<typeof academicTermFormSchema>;

const startOfDay = (value: string): string => `${value}T00:00:00.000Z`;

export function toCreatePayload(values: AcademicTermFormValues) {
  return {
    code: values.code,
    name: values.name,
    kind: values.kind,
    academicYear: values.academicYear,
    startsAt: startOfDay(values.startsAt),
    endsAt: startOfDay(values.endsAt),
    enrollmentOpensAt:
      values.enrollmentOpensAt === '' ? null : startOfDay(values.enrollmentOpensAt),
    enrollmentClosesAt:
      values.enrollmentClosesAt === '' ? null : startOfDay(values.enrollmentClosesAt),
  };
}
