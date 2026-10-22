import { apiQueries } from '@/shared/api';

export const submissionQueries = {
  mine: apiQueries.listMySubmissionsOptions,
  mineKey: apiQueries.listMySubmissionsQueryKey,
  forAssignment: apiQueries.listAssignmentSubmissionsOptions,
  forAssignmentKey: apiQueries.listAssignmentSubmissionsQueryKey,
  fileDownloadUrl: apiQueries.getSubmissionFileDownloadUrlOptions,
} as const;

export const submissionMutations = {
  submit: apiQueries.submitAssignmentMutation,
  uploadTicket: apiQueries.createSubmissionUploadTicketMutation,
  mark: apiQueries.markSubmissionMutation,
} as const;
