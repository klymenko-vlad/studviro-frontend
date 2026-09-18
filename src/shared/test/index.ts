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
  enrollableOfferings,
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
  offeringResults,
  roleAssignments,
  session,
  studyProgress,
  learningReconciliationReport,
  reconciliationReport,
  reconciliationResolutions,
  syncRunDetail,
  syncRuns,
  syncState,
  teachingOfferings,
  timetableEvents,
  users,
  writeIntents,
} from './msw/handlers';
export { server } from './msw/server';
