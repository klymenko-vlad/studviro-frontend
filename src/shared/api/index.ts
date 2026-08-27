/**
 * Public API of the `shared/api` slice.
 *
 * Everything under `generated/` is produced by `pnpm api:generate` from the
 * backend's committed `openapi.json` — never edit it, and never import from it
 * directly (ESLint blocks the deep path). Re-export what the app needs here so a
 * regeneration that renames a symbol breaks in exactly one file.
 */
export { ApiError, toApiError } from './error';
export { getQueryClient } from './query-client';

export { client } from './generated/client.gen';
export {
  Auth,
  Identities,
  Institutions,
  RoleAssignments,
  Users,
} from './generated/sdk.gen';

export * as apiQueries from './generated/@tanstack/react-query.gen';

/**
 * Generated Zod schemas, carrying the backend's own constraints (email format,
 * min/max lengths). Forms validate against these so the client and the server
 * cannot disagree about what a valid payload is.
 */
export * as apiSchemas from './generated/zod.gen';

export type {
  AuthTokensDto,
  ConnectorStatusResponseDto,
  CreateUserDto,
  CreateUserDtoWritable,
  ErrorResponseDto,
  ExternalIdentityResponseDto,
  GrantRoleDto,
  InstitutionConfigurationResponseDto,
  InstitutionResponseDto,
  LoginDto,
  MyCourseResponseDto,
  MyPermissionsResponseDto,
  LoginDtoWritable,
  PageMetaDto,
  RefreshTokenDto,
  RoleAssignmentResponseDto,
  UpdateInstitutionConfigurationDto,
  UpdateMeDto,
  UserResponseDto,
  UserResponseDtoPage,
} from './generated/types.gen';
export { SortOrder } from './generated/types.gen';
