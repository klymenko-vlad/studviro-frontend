import { z } from 'zod';

import type { Assignment } from '@/entities/assignment';
import { apiSchemas } from '@/shared/api';

const moment = z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/u, 'Use a date and a time'),
  z.literal(''),
]);

/**
 * The window is three optional instants, and the order between them is the
 * server's rule (`ASSIGNMENT_WINDOW_INVALID`). It is repeated here so an author
 * is told before the round trip, not instead of it.
 */
export const assignmentFormSchema = z
  .object({
    name: apiSchemas.zCreateAssignmentDto.shape.name,
    brief: z.string().max(20_000),
    opensAt: moment,
    dueAt: moment,
    closesAt: moment,
    maxAttempts: z.string().regex(/^\d*$/u, 'Use a whole number of attempts'),
    allowsLateSubmission: z.boolean(),
    maxPoints: z.string().regex(/^\d*$/u, 'Use a whole number of points'),
    countsTowardFinalGrade: z.boolean(),
    visible: z.boolean(),
  })
  .refine(
    values =>
      values.opensAt === '' || values.dueAt === '' || values.dueAt >= values.opensAt,
    {
      path: ['dueAt'],
      message: 'An assignment falls due after it opens',
    },
  )
  .refine(
    values =>
      values.dueAt === '' || values.closesAt === '' || values.closesAt >= values.dueAt,
    { path: ['closesAt'], message: 'An assignment closes after it falls due' },
  )
  .refine(values => values.maxAttempts === '' || Number(values.maxAttempts) >= 1, {
    path: ['maxAttempts'],
    message: 'Allow at least one attempt, or none for unlimited',
  })
  .refine(values => values.maxAttempts === '' || Number(values.maxAttempts) <= 100, {
    path: ['maxAttempts'],
    message: 'At most one hundred attempts',
  });

export type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;

export const EMPTY_ASSIGNMENT: AssignmentFormValues = {
  name: '',
  brief: '',
  opensAt: '',
  dueAt: '',
  closesAt: '',
  maxAttempts: '1',
  allowsLateSubmission: false,
  maxPoints: '',
  countsTowardFinalGrade: true,
  visible: false,
};

const toLocalInput = (iso: string | null) => (iso === null ? '' : iso.slice(0, 16));
const toInstant = (value: string) => (value === '' ? null : `${value}:00.000Z`);

export function toFormValues(assignment: Assignment): AssignmentFormValues {
  return {
    name: assignment.name,
    brief: assignment.brief ?? '',
    opensAt: toLocalInput(assignment.opensAt),
    dueAt: toLocalInput(assignment.dueAt),
    closesAt: toLocalInput(assignment.closesAt),
    maxAttempts: assignment.maxAttempts === null ? '' : String(assignment.maxAttempts),
    allowsLateSubmission: assignment.allowsLateSubmission,
    maxPoints: assignment.maxPoints === null ? '' : String(assignment.maxPoints),
    countsTowardFinalGrade: assignment.countsTowardFinalGrade,
    visible: assignment.visible,
  };
}

export function toAssignmentPayload(values: AssignmentFormValues) {
  return {
    name: values.name,
    brief: values.brief === '' ? null : values.brief,
    opensAt: toInstant(values.opensAt),
    dueAt: toInstant(values.dueAt),
    closesAt: toInstant(values.closesAt),
    maxAttempts: values.maxAttempts === '' ? null : Number(values.maxAttempts),
    allowsLateSubmission: values.allowsLateSubmission,
    maxPoints: values.maxPoints === '' ? null : Number(values.maxPoints),
    countsTowardFinalGrade: values.countsTowardFinalGrade,
    visible: values.visible,
  };
}
