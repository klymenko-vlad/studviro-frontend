import type { z } from 'zod';

import { apiSchemas } from '@/shared/api';

const notBlank = (value: string) => value.trim() !== '';

export const threadFormSchema = apiSchemas.zCreateDiscussionThreadDto
  .refine(values => notBlank(values.title), { path: ['title'], message: 'Required' })
  .refine(values => notBlank(values.body), { path: ['body'], message: 'Required' });

export const replyFormSchema = apiSchemas.zCreateDiscussionPostDto.refine(
  values => notBlank(values.body),
  { path: ['body'], message: 'Required' },
);

export type ThreadFormValues = z.infer<typeof threadFormSchema>;
export type ReplyFormValues = z.infer<typeof replyFormSchema>;
