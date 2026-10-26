'use client';

import { useQueryClient } from '@tanstack/react-query';

import { isDiscussionRead } from '@/entities/discussion';

export function useRefreshDiscussion() {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ predicate: isDiscussionRead });
}
