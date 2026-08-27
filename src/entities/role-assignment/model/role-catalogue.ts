import { apiSchemas } from '@/shared/api';

import type { CanonicalRole, RoleScope } from './role-assignment';

export const CANONICAL_ROLES = apiSchemas.zGrantRoleDto.shape.role
  .options as readonly CanonicalRole[];

export const ROLE_SCOPES = apiSchemas.zGrantRoleDto.shape.scopeType
  .options as readonly RoleScope[];
