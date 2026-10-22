import { z } from 'zod';

import { apiSchemas } from '@/shared/api';

const MAX_CAPACITY = 10_000;

/**
 * Only the fields an input cannot express as the API models them are replaced.
 * A text input and a select both give `''` for "not set"; the API takes
 * `null`. Capacity stays a string all the way to the payload: `z.coerce` would
 * make the schema's input and output types differ, which react-hook-form
 * cannot type a resolver against.
 */
export const roomFormSchema = apiSchemas.zCreateRoomDto
  .omit({ name: true, building: true, capacity: true, orgUnitId: true })
  .extend({
    name: z.string().max(200),
    building: z.string().max(200),
    capacity: z
      .string()
      .regex(/^\d*$/u, 'Use a whole number of seats')
      .refine(value => value === '' || Number(value) <= MAX_CAPACITY, {
        message: `At most ${MAX_CAPACITY} seats`,
      }),
    orgUnitId: z.union([z.uuid(), z.literal('')]),
  });

export type RoomFormValues = z.infer<typeof roomFormSchema>;

export function toCreatePayload(values: RoomFormValues) {
  const blankToNull = (value: string) => (value === '' ? null : value);

  return {
    code: values.code,
    name: blankToNull(values.name),
    building: blankToNull(values.building),
    capacity: values.capacity === '' ? null : Number(values.capacity),
    orgUnitId: blankToNull(values.orgUnitId),
  };
}
