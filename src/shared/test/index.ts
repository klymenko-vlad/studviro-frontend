/**
 * Public API of the test-support segment. Test files import from
 * `@/shared/test` rather than reaching into individual modules.
 */
export { renderWithProviders, screen, userEvent, waitFor, within } from './render';
export {
  assessmentResults,
  connectorCredentials,
  connectorStatuses,
  courseOffering,
  courseRoster,
  courseResults,
  deadlines,
  enrolledCourses,
  errorResponse,
  examTerms,
  handlers,
  institutionConfiguration,
  institutions,
  learningSpaces,
  permissions,
  linkedAccounts,
  notifications,
  roleAssignments,
  session,
  reconciliationReport,
  reconciliationResolutions,
  syncRunDetail,
  syncRuns,
  syncState,
  teachingOfferings,
  timetableEvents,
  users,
} from './msw/handlers';
export { server } from './msw/server';
