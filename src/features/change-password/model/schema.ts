import { z } from 'zod';

import { apiSchemas } from '@/shared/api';

export function buildChangePasswordSchema(messages: { passwordMismatch: string }) {
  return apiSchemas.zChangePasswordDto
    .extend({ confirmPassword: z.string().min(1) })
    .refine(values => values.newPassword === values.confirmPassword, {
      message: messages.passwordMismatch,
      path: ['confirmPassword'],
    });
}

export type ChangePasswordValues = z.infer<ReturnType<typeof buildChangePasswordSchema>>;

export const CURRENT_PASSWORD_INCORRECT = 'CURRENT_PASSWORD_INCORRECT';
export const PASSWORD_UNCHANGED = 'PASSWORD_UNCHANGED';
