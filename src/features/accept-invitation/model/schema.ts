import { z } from 'zod';

import { apiSchemas } from '@/shared/api';

/**
 * The generated schema allows every field to be absent — the server decides
 * whether they are required, depending on whether the address already belongs
 * to an active account. The form always collects them so it can offer the
 * password path without a second round trip; the server's error, if any,
 * lands on the right field.
 */
export function buildAcceptInvitationSchema(messages: { passwordMismatch: string }) {
  return apiSchemas.zAcceptInvitationDto
    .extend({
      displayName: z.union([
        z.literal(''),
        apiSchemas.zAcceptInvitationDto.shape.displayName,
      ]),
      password: z.union([z.literal(''), apiSchemas.zAcceptInvitationDto.shape.password]),
      confirmPassword: z.string().optional(),
    })
    .refine(values => !values.password || values.password === values.confirmPassword, {
      message: messages.passwordMismatch,
      path: ['confirmPassword'],
    });
}

export type AcceptInvitationFormValues = z.infer<
  ReturnType<typeof buildAcceptInvitationSchema>
>;
