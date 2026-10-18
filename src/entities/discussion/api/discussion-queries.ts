import { apiQueries } from '@/shared/api';

export const discussionQueries = {
  threads: apiQueries.listDiscussionThreadsOptions,
  threadsKey: apiQueries.listDiscussionThreadsQueryKey,
  thread: apiQueries.getDiscussionThreadOptions,
  threadKey: apiQueries.getDiscussionThreadQueryKey,
} as const;

export const discussionMutations = {
  start: apiQueries.startDiscussionThreadMutation,
  reply: apiQueries.replyToDiscussionThreadMutation,
  deletePost: apiQueries.deleteDiscussionPostMutation,
  setThreadVisibility: apiQueries.setDiscussionThreadVisibilityMutation,
  setPostVisibility: apiQueries.setDiscussionPostVisibilityMutation,
} as const;
