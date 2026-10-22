import type { z } from 'zod';

import { apiSchemas } from '@/shared/api';

/**
 * Derived from the *generated* request schema so the email format the
 * backend enforces is applied here without a second copy that can disagree
 * with it.
 */
export const requestPasswordResetSchema = apiSchemas.zRequestPasswordResetDto;

export type RequestPasswordResetFormValues = z.infer<typeof requestPasswordResetSchema>;
