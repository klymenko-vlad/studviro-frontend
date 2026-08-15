import { z } from 'zod';

import { apiSchemas } from '@/shared/api';

/**
 * The generated schema cannot express the rule the server enforces: an
 * institution-wide grant names no scope, and every narrower grant must name one.
 * Both messages are user-facing, so they arrive from the caller's translations.
 */
export function buildGrantRoleFormSchema(messages: {
  scopeIdRequired: string;
  scopeIdNotAllowed: string;
}) {
  return apiSchemas.zGrantRoleDto
    .omit({ validFrom: true, validUntil: true })
    .extend({ scopeId: z.union([z.literal(''), z.uuid()]) })
    .superRefine((values, context) => {
      const named = values.scopeId.trim().length > 0;

      if (values.scopeType === 'institution' && named) {
        context.addIssue({
          code: 'custom',
          path: ['scopeId'],
          message: messages.scopeIdNotAllowed,
        });
      }

      if (values.scopeType !== 'institution' && !named) {
        context.addIssue({
          code: 'custom',
          path: ['scopeId'],
          message: messages.scopeIdRequired,
        });
      }
    });
}

export type GrantRoleFormValues = z.infer<ReturnType<typeof buildGrantRoleFormSchema>>;
