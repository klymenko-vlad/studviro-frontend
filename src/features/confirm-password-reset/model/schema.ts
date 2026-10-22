import { z } from 'zod';

import { apiSchemas } from '@/shared/api';

/**
 * Derived from the *generated* confirm schema, extended with a client-only
 * `confirmPassword` the API never sees, so the length bound the backend
 * enforces is applied here without a second copy that can disagree with it.
 */
export function buildConfirmPasswordResetSchema(messages: { passwordMismatch: string }) {
  return apiSchemas.zConfirmPasswordResetDto
    .extend({ confirmPassword: z.string() })
    .refine(values => values.password === values.confirmPassword, {
      message: messages.passwordMismatch,
      path: ['confirmPassword'],
    });
}

export type ConfirmPasswordResetFormValues = z.infer<
  ReturnType<typeof buildConfirmPasswordResetSchema>
>;
