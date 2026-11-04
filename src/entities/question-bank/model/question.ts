import type {
  QuestionCategoryResponseDto,
  QuestionResponseDto,
  QuestionSummaryDto,
  QuestionType,
} from '@/shared/api';

export type Question = QuestionResponseDto;
export type QuestionSummary = QuestionSummaryDto;
export type QuestionCategory = QuestionCategoryResponseDto;
export type { QuestionType };

export const QUESTION_TYPES = [
  'single_choice',
  'multiple_choice',
  'true_false',
  'short_answer',
  'numerical',
  'matching',
  'essay',
] as const satisfies readonly QuestionType[];
