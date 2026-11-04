'use client';

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { completionMutations, invalidateMyProgress } from '@/entities/completion';

export function useRecordView(institutionId: string, spaceId: string) {
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    ...completionMutations.recordView(),
    onSuccess: () => invalidateMyProgress(queryClient),
  });

  return useCallback(
    (materialId: string) => {
      mutate({ path: { institutionId, spaceId, materialId } });
    },
    [mutate, institutionId, spaceId],
  );
}
