import { z } from 'zod';

/**
 * Points stay a string as far as the payload boundary for the same reason the
 * study-group capacity does: `z.coerce` splits the schema's input and output
 * types, which react-hook-form cannot resolve against.
 */
export const markFormSchema = z.object({
  points: z.string().regex(/^\d*(\.\d+)?$/u, 'Use a number of points'),
  feedback: z.string().max(10_000),
});

export type MarkFormValues = z.infer<typeof markFormSchema>;

export function toMarkPayload(values: MarkFormValues) {
  return {
    points: values.points === '' ? null : Number(values.points),
    feedback: values.feedback === '' ? null : values.feedback,
  };
}
