import type { z } from 'zod';

import { apiSchemas } from '@/shared/api';

/**
 * Derived from the *generated* login schema rather than restated, so the email
 * format and length bounds the backend enforces are applied client-side without
 * a second copy that can disagree with it.
 *
 * Note this is `zLoginDtoWritable`, not the signup schema: login deliberately
 * does not apply the password policy. Rejecting a short password before sending
 * it would let anyone read off the current policy, and would lock out a
 * credential set from before the policy last changed.
 */
export const signInSchema = apiSchemas.zLoginDtoWritable;

export type SignInFormValues = z.infer<typeof signInSchema>;
