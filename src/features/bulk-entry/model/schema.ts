import { z } from 'zod';

import { apiSchemas } from '@/shared/api';

export const bulkFormSchema = apiSchemas.zBulkImportDto.omit({ dryRun: true }).extend({
  text: apiSchemas.zBulkImportDto.shape.text,
});

export type BulkFormValues = z.infer<typeof bulkFormSchema>;

export const BULK_KINDS = ['offerings', 'members'] as const;
export type BulkKind = (typeof BULK_KINDS)[number];

/** What the first row must say, per kind — shown above the box, not guessed at. */
export const BULK_COLUMNS: Readonly<Record<BulkKind, string>> = {
  offerings: 'courseCode,termCode,capacity,language',
  members: 'email,programCode,studyYear',
};

export const BULK_EXAMPLE: Readonly<Record<BulkKind, string>> = {
  offerings: 'courseCode,termCode,capacity\nINF/ALG/22,2026W,60',
  members: 'email,programCode,studyYear\nada@example.com,INF-BC,1',
};

export const bulkKindSchema = z.enum(BULK_KINDS);
