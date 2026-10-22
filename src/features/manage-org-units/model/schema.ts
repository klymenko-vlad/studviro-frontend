import { z } from 'zod';

import { apiSchemas } from '@/shared/api';

/**
 * Derived from the API's own schema, so code and name cannot disagree about
 * what is valid. Only `parentId` is replaced: it comes from a select whose
 * empty option means "a root unit", and the API takes `null` for that.
 */
export const orgUnitFormSchema = apiSchemas.zCreateOrgUnitDto
  .omit({ parentId: true, type: true })
  .extend({
    type: apiSchemas.zCreateOrgUnitDto.shape.type.unwrap(),
    parentId: z.union([z.uuid(), z.literal('')]),
  });

export type OrgUnitFormValues = z.infer<typeof orgUnitFormSchema>;

export const ORG_UNIT_TYPES = apiSchemas.zCreateOrgUnitDto.shape.type.unwrap().options;

export function toCreatePayload(values: OrgUnitFormValues) {
  return {
    code: values.code,
    name: values.name,
    type: values.type,
    parentId: values.parentId === '' ? null : values.parentId,
  };
}
