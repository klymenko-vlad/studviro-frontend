import type {
  DiscussionPostDto,
  DiscussionQuoteDto,
  DiscussionThreadDto,
  DiscussionThreadSummaryDto,
} from '@/shared/api';

export type DiscussionThread = DiscussionThreadDto;
export type DiscussionThreadSummary = DiscussionThreadSummaryDto;
export type DiscussionPost = DiscussionPostDto;
export type DiscussionQuote = DiscussionQuoteDto;

export interface DiscussionAddress {
  institutionId: string;
  offeringId: string;
}

export const discussionPostAnchor = (postId: string): string =>
  `discussion-post-${postId}`;
