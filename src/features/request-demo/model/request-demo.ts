import type { z } from 'zod';

import { apiSchemas } from '@/shared/api';

/**
 * The generated schema, unchanged. The honeypot is part of it, so a bot that
 * fills every field it finds still produces a payload the backend accepts and
 * silently drops — which is the whole point of the trap.
 */
export const requestDemoSchema = apiSchemas.zCreateDemoRequestDtoWritable;

export type RequestDemoFormValues = z.infer<typeof requestDemoSchema>;

export const REQUEST_DEMO_DEFAULTS: RequestDemoFormValues = {
  institutionName: '',
  contactName: '',
  email: '',
  role: '',
  message: '',
  website: '',
};
