import type {
  DiscussionPostDto,
  DiscussionThreadDto,
  DiscussionThreadSummaryDto,
} from '@/shared/api';

export type DiscussionThread = DiscussionThreadDto;
export type DiscussionThreadSummary = DiscussionThreadSummaryDto;
export type DiscussionPost = DiscussionPostDto;

export interface DiscussionAddress {
  institutionId: string;
  offeringId: string;
}
