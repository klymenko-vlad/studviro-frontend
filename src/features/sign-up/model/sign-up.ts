import { z } from 'zod';

import { apiSchemas } from '@/shared/api';

/**
 * Derived from the *generated* registration schema, so the email format, the
 * 12-character password floor and the 120-character name bound the backend
 * enforces are applied here without a second copy that can disagree with it.
 *
 * A factory rather than a constant because the mismatch message is user-facing
 * and has to come from the caller's translations — Zod wants a plain string,
 * and a schema built at module scope has no locale to resolve one in.
 */
export function buildSignUpSchema(messages: { passwordMismatch: string }) {
  return apiSchemas.zCreateUserDtoWritable
    .extend({ confirmPassword: z.string() })
    .refine(values => values.password === values.confirmPassword, {
      message: messages.passwordMismatch,
      path: ['confirmPassword'],
    });
}

export type SignUpFormValues = z.infer<ReturnType<typeof buildSignUpSchema>>;
