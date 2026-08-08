import { z } from 'zod';

import { apiSchemas } from '@/shared/api';

/**
 * Form schema derived from the *generated* request schema, so every constraint
 * the backend enforces (email format, 12-character password, 120-character name)
 * is applied client-side without being restated — and a backend change to any of
 * them shows up here on the next `pnpm api:generate`.
 *
 * Only genuinely client-side concerns are added on top; `confirmPassword` has no
 * server counterpart because the server never receives it.
 *
 * A factory rather than a constant because the mismatch message is user-facing
 * and therefore has to come from the caller's translations — Zod wants a plain
 * string, and a schema built at module scope has no locale to resolve it in.
 */
export function buildCreateUserFormSchema(messages: { passwordMismatch: string }) {
  return apiSchemas.zCreateUserDtoWritable
    .extend({
      confirmPassword: z.string(),
    })
    .refine(values => values.password === values.confirmPassword, {
      message: messages.passwordMismatch,
      path: ['confirmPassword'],
    });
}

export type CreateUserFormValues = z.infer<ReturnType<typeof buildCreateUserFormSchema>>;
