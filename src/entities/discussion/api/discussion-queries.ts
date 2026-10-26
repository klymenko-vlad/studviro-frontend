import type { Query } from '@tanstack/react-query';

import { apiQueries } from '@/shared/api';

interface CursorPage {
  meta: { nextCursor: string | null };
}

const nextCursor = (lastPage: CursorPage): string | undefined =>
  lastPage.meta.nextCursor ?? undefined;

const READS = new Set([
  'listDiscussionThreads',
  'getDiscussionThread',
  'listDiscussionPosts',
  'listDiscussionReplies',
]);

/**
 * The thread list, a thread and its pages of posts and replies are separate
 * queries; a post, an edit or a moderation can change any of them, so a change
 * refetches every discussion read rather than guessing which pages it touched.
 */
export function isDiscussionRead(query: Pick<Query, 'queryKey'>): boolean {
  const [head] = query.queryKey as [{ _id?: string } | undefined];

  return head?._id !== undefined && READS.has(head._id);
}

export const discussionQueries = {
  threads: (
    options: Parameters<typeof apiQueries.listDiscussionThreadsInfiniteOptions>[0],
  ) => ({
    ...apiQueries.listDiscussionThreadsInfiniteOptions(options),
    initialPageParam: '',
    getNextPageParam: nextCursor,
  }),
  thread: apiQueries.getDiscussionThreadOptions,
  threadKey: apiQueries.getDiscussionThreadQueryKey,
  posts: (
    options: Parameters<typeof apiQueries.listDiscussionPostsInfiniteOptions>[0],
  ) => ({
    ...apiQueries.listDiscussionPostsInfiniteOptions(options),
    initialPageParam: '',
    getNextPageParam: nextCursor,
  }),
  replies: (
    options: Parameters<typeof apiQueries.listDiscussionRepliesInfiniteOptions>[0],
  ) => ({
    ...apiQueries.listDiscussionRepliesInfiniteOptions(options),
    initialPageParam: '',
    getNextPageParam: nextCursor,
  }),
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
