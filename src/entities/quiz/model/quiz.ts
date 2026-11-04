import type { QuizResponseDto, QuizSlotResponseDto } from '@/shared/api';

export type Quiz = QuizResponseDto;
export type QuizSlot = QuizSlotResponseDto;

export const QUIZ_GRADING_METHODS = ['highest', 'last', 'average'] as const;
export const QUIZ_LAYOUTS = ['one_per_page', 'all_on_one'] as const;

export function quizEditorHref(
  institutionId: string,
  offeringId: string,
  spaceId: string,
  quizId: string,
): string {
  return `/institutions/${institutionId}/courses/${offeringId}/spaces/${spaceId}/quizzes/${quizId}`;
}

export function questionBankHref(
  institutionId: string,
  offeringId: string,
  spaceId: string,
): string {
  return `/institutions/${institutionId}/courses/${offeringId}/spaces/${spaceId}/question-bank`;
}
