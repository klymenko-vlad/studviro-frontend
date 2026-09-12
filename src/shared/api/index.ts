import {
  cancelExamRegistrationMutation,
  clearInstitutionConnectorCredentialMutation,
  countMyUnreadNotificationsOptions,
  countMyUnreadNotificationsQueryKey,
  createDemoRequestMutation,
  createMutation,
  findAllInfiniteOptions,
  findAllOptions,
  findAllQueryKey,
  findOneOptions,
  findOneQueryKey,
  getCourseOfferingOptions,
  getCourseOfferingQueryKey,
  getCourseRosterOptions,
  getCourseRosterQueryKey,
  getInstitutionConfigurationOptions,
  getInstitutionConfigurationQueryKey,
  getInstitutionConnectorCredentialsOptions,
  getInstitutionConnectorCredentialsQueryKey,
  getInstitutionOptions,
  getInstitutionQueryKey,
  getSynchronizationReconciliationOptions,
  getSynchronizationReconciliationQueryKey,
  getSynchronizationRunOptions,
  getSynchronizationRunQueryKey,
  getSynchronizationStateOptions,
  getSynchronizationStateQueryKey,
  grantRoleMutation,
  listInstitutionConnectorsOptions,
  listInstitutionConnectorsQueryKey,
  listMyCourseResultsOptions,
  listMyCourseResultsQueryKey,
  listMyCoursesOptions,
  listMyCoursesQueryKey,
  listMyExamTermsOptions,
  listMyExamTermsQueryKey,
  listMyIdentitiesOptions,
  listMyIdentitiesQueryKey,
  listMyInstitutionsOptions,
  listMyInstitutionsQueryKey,
  listMyNotificationsOptions,
  listMyNotificationsQueryKey,
  listMyPermissionsOptions,
  listMyPermissionsQueryKey,
  listMyRolesOptions,
  listMyRolesQueryKey,
  listMyTeachingOfferingsOptions,
  listMyTeachingOfferingsQueryKey,
  listMyTimetableEventsOptions,
  listMyTimetableEventsQueryKey,
  listRoleAssignmentsOptions,
  listRoleAssignmentsQueryKey,
  listSynchronizationRunsOptions,
  listSynchronizationRunsQueryKey,
  markAllMyNotificationsReadMutation,
  markMyNotificationReadMutation,
  registerForExamTermMutation,
  removeMutation,
  revokeRoleMutation,
  setInstitutionConnectorCredentialsMutation,
  startSynchronizationRunMutation,
  updateInstitutionConfigurationMutation,
} from './generated/@tanstack/react-query.gen';
import {
  zCreateDemoRequestDtoWritable,
  zCreateUserDtoWritable,
  zGrantRoleDto,
  zLoginDtoWritable,
} from './generated/zod.gen';

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

/**
 * The generated TanStack query options and mutations the app actually calls.
 *
 * Named one by one for the same reason as `apiSchemas`: `export * as` builds an
 * object referencing every generated operation, so the whole API surface lands
 * in the client bundle whether or not a screen queries it. Add an entry here
 * when a slice needs one.
 */
export const apiQueries = {
  cancelExamRegistrationMutation,
  clearInstitutionConnectorCredentialMutation,
  countMyUnreadNotificationsOptions,
  countMyUnreadNotificationsQueryKey,
  createDemoRequestMutation,
  createMutation,
  findAllInfiniteOptions,
  findAllOptions,
  findAllQueryKey,
  findOneOptions,
  findOneQueryKey,
  getCourseOfferingOptions,
  getCourseOfferingQueryKey,
  getCourseRosterOptions,
  getCourseRosterQueryKey,
  getInstitutionConfigurationOptions,
  getInstitutionConfigurationQueryKey,
  getInstitutionConnectorCredentialsOptions,
  getInstitutionConnectorCredentialsQueryKey,
  getInstitutionOptions,
  getInstitutionQueryKey,
  getSynchronizationReconciliationOptions,
  getSynchronizationReconciliationQueryKey,
  getSynchronizationRunOptions,
  getSynchronizationRunQueryKey,
  getSynchronizationStateOptions,
  getSynchronizationStateQueryKey,
  grantRoleMutation,
  listInstitutionConnectorsOptions,
  listInstitutionConnectorsQueryKey,
  listMyCourseResultsOptions,
  listMyCourseResultsQueryKey,
  listMyExamTermsOptions,
  listMyExamTermsQueryKey,
  listMyCoursesOptions,
  listMyCoursesQueryKey,
  listMyIdentitiesOptions,
  listMyIdentitiesQueryKey,
  listMyInstitutionsOptions,
  listMyInstitutionsQueryKey,
  listMyNotificationsOptions,
  listMyNotificationsQueryKey,
  listMyPermissionsOptions,
  listMyPermissionsQueryKey,
  listMyRolesOptions,
  listMyRolesQueryKey,
  listMyTeachingOfferingsOptions,
  listMyTeachingOfferingsQueryKey,
  listMyTimetableEventsOptions,
  listMyTimetableEventsQueryKey,
  listRoleAssignmentsOptions,
  listRoleAssignmentsQueryKey,
  listSynchronizationRunsOptions,
  listSynchronizationRunsQueryKey,
  markAllMyNotificationsReadMutation,
  markMyNotificationReadMutation,
  registerForExamTermMutation,
  removeMutation,
  revokeRoleMutation,
  setInstitutionConnectorCredentialsMutation,
  startSynchronizationRunMutation,
  updateInstitutionConfigurationMutation,
} as const;

/**
 * Generated Zod schemas, carrying the backend's own constraints (email format,
 * min/max lengths). Forms validate against these so the client and the server
 * cannot disagree about what a valid payload is.
 *
 * Named one by one rather than re-exported as a namespace: `export * as` builds
 * an object referencing all 108 generated schemas, which pins every one of them
 * into the client bundle. Add an entry here when a form needs it.
 */
export const apiSchemas = {
  zCreateDemoRequestDtoWritable,
  zCreateUserDtoWritable,
  zGrantRoleDto,
  zLoginDtoWritable,
} as const;

export type {
  AuthTokensDto,
  CreateDemoRequestDto,
  CreateDemoRequestDtoWritable,
  ConnectorCredentialFieldDto,
  ConnectorCredentialsResponseDto,
  ConnectorStatusResponseDto,
  CourseOfferingResponseDto,
  CreateUserDto,
  CreateUserDtoWritable,
  ErrorResponseDto,
  ExternalIdentityResponseDto,
  GrantRoleDto,
  InstitutionConfigurationResponseDto,
  InstitutionResponseDto,
  LoginDto,
  MyCourseResponseDto,
  MyCourseResultResponseDto,
  MyExamTermResponseDto,
  MyPermissionsResponseDto,
  MyTimetableEventResponseDto,
  NotificationResponseDto,
  UnreadNotificationsResponseDto,
  CourseRosterResponseDto,
  TeachingOfferingResponseDto,
  LoginDtoWritable,
  PageMetaDto,
  RefreshTokenDto,
  RoleAssignmentResponseDto,
  DiscrepancyResponseDto,
  DomainReconciliationResponseDto,
  ReconciliationReportResponseDto,
  SyncDomainResultResponseDto,
  SyncRunDetailResponseDto,
  SyncRunResponseDto,
  SyncWatermarkResponseDto,
  UpdateInstitutionConfigurationDto,
  UpdateMeDto,
  UserResponseDto,
  UserResponseDtoPage,
} from './generated/types.gen';
export { SortOrder } from './generated/types.gen';
