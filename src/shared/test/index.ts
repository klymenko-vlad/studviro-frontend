/**
 * Public API of the test-support segment. Test files import from
 * `@/shared/test` rather than reaching into individual modules.
 */
export { renderWithProviders, screen, userEvent, waitFor, within } from './render';
export {
  academicTerms,
  adminOfferings,
  assessmentResults,
  catalogueCourses,
  programMembers,
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
  people,
  permissions,
  linkedAccounts,
  notifications,
  offeringResults,
  roleAssignments,
  rooms,
  session,
  studyGroups,
  studyProgress,
  teachingAssignments,
  teachingOfferings,
  timetableEvents,
  users,
} from './msw/handlers';
export { server } from './msw/server';
