/**
 * Public API of the test-support segment. Test files import from
 * `@/shared/test` rather than reaching into individual modules.
 */
export { renderWithProviders, screen, userEvent, waitFor, within } from './render';
export {
  connectorStatuses,
  courseOffering,
  courseResults,
  enrolledCourses,
  errorResponse,
  handlers,
  institutionConfiguration,
  institutions,
  permissions,
  linkedAccounts,
  roleAssignments,
  session,
  users,
} from './msw/handlers';
export { server } from './msw/server';
