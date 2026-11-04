import { useQueryClient } from '@tanstack/react-query';

import { quizQueries } from '@/entities/quiz';

export interface QuizPath {
  institutionId: string;
  spaceId: string;
  quizId: string;
}

export function useRefreshQuiz(path: QuizPath) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: quizQueries.slotsKey({ path }) }),
      queryClient.invalidateQueries({ queryKey: quizQueries.detailKey({ path }) }),
      queryClient.invalidateQueries({
        queryKey: quizQueries.listKey({
          path: { institutionId: path.institutionId, spaceId: path.spaceId },
        }),
      }),
    ]);
}
