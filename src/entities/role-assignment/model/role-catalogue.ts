import { apiSchemas } from '@/shared/api';

export const GRANTABLE_ROLES = apiSchemas.zGrantRoleDto.shape.role.options;

export const ROLE_SCOPES = apiSchemas.zGrantRoleDto.shape.scopeType.options;
