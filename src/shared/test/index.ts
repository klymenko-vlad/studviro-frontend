/**
 * Public API of the test-support segment. Test files import from
 * `@/shared/test` rather than reaching into individual modules.
 */
export { renderWithProviders, screen, userEvent, waitFor, within } from './render';
export {
  academicTerms,
  assessmentResults,
  catalogueCourses,
  programs,
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
  rooms,
  session,
  studyProgress,
  teachingOfferings,
  timetableEvents,
  users,
} from './msw/handlers';
export { server } from './msw/server';
