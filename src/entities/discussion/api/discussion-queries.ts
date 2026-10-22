import { apiQueries } from '@/shared/api';

export const discussionQueries = {
  threads: apiQueries.listDiscussionThreadsOptions,
  threadsKey: apiQueries.listDiscussionThreadsQueryKey,
  thread: apiQueries.getDiscussionThreadOptions,
  threadKey: apiQueries.getDiscussionThreadQueryKey,
  attachmentDownloadUrl: apiQueries.getDiscussionAttachmentDownloadUrlOptions,
} as const;

export const discussionMutations = {
  start: apiQueries.startDiscussionThreadMutation,
  reply: apiQueries.replyToDiscussionThreadMutation,
  attachmentTicket: apiQueries.createDiscussionAttachmentTicketMutation,
  editPost: apiQueries.editDiscussionPostMutation,
  renameThread: apiQueries.renameDiscussionThreadMutation,
  deletePost: apiQueries.deleteDiscussionPostMutation,
  setThreadVisibility: apiQueries.setDiscussionThreadVisibilityMutation,
  setPostVisibility: apiQueries.setDiscussionPostVisibilityMutation,
} as const;
