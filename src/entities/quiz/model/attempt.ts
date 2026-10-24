import type {
  MyQuizAttemptDto,
  QuizAnswerDto,
  QuizAttemptQuestionDto,
  QuizAttemptResponseDto,
  QuizAttemptRowDto,
  QuizAttemptStandingDto,
  SaveQuizAnswerDto,
} from '@/shared/api';

import { quizEditorHref } from './quiz';

export type QuizAttempt = QuizAttemptResponseDto;
export type AttemptQuestion = QuizAttemptQuestionDto;
export type AttemptAnswer = SaveQuizAnswerDto;
export type SavedAnswer = QuizAnswerDto;
export type MyQuizAttempt = MyQuizAttemptDto;
export type AttemptStanding = QuizAttemptStandingDto;
export type QuizAttemptRow = QuizAttemptRowDto;

export const QUIZ_ATTEMPT_PROGRESS = ['in_progress', 'finished'] as const;

export function quizAttemptHref(
  institutionId: string,
  offeringId: string,
  spaceId: string,
  quizId: string,
  attemptId: string,
): string {
  return `${quizEditorHref(institutionId, offeringId, spaceId, quizId)}/attempts/${attemptId}`;
}

export function answerOf(saved: SavedAnswer | null): AttemptAnswer | null {
  if (saved === null) return null;

  return Object.fromEntries(Object.entries(saved).filter(([, value]) => value !== null));
}

export function isAnswered(answer: AttemptAnswer | null): boolean {
  if (answer === null) return false;

  return Object.values(answer).some(value =>
    Array.isArray(value)
      ? value.length > 0
      : typeof value === 'string'
        ? value.trim() !== ''
        : value !== null,
  );
}
