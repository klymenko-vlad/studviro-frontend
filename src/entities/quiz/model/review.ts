import type {
  MarkedQuizQuestionDto,
  QuizAnswerDto,
  QuizAttemptMarkingResponseDto,
  QuizAttemptPartDto,
  QuizAttemptReviewResponseDto,
  QuizQuestionResultDto,
  QuizQuestionReviewDto,
  QuizRegradeResponseDto,
  QuizRevealedKeyDto,
  QuizReviewShownDto,
} from '@/shared/api';

export type AttemptReview = QuizAttemptReviewResponseDto;
export type ReviewedQuestion = QuizQuestionReviewDto;
export type QuizReviewShown = QuizReviewShownDto;
export type AttemptForMarking = QuizAttemptMarkingResponseDto;
export type MarkedQuestion = MarkedQuizQuestionDto;
export type RegradeSummary = QuizRegradeResponseDto;
export type QuestionResult = QuizQuestionResultDto;

export const QUIZ_REVIEW_TIMINGS = ['immediately', 'after_close', 'never'] as const;
export const QUIZ_REVIEW_OPTIONS = [
  'responses',
  'correctness',
  'correctAnswer',
  'feedback',
  'overallMark',
] as const;

export interface Described {
  readonly texts: readonly string[];
  readonly value: boolean | null;
}

interface Parts {
  readonly choices: readonly QuizAttemptPartDto[];
  readonly prompts: readonly QuizAttemptPartDto[];
  readonly answers: readonly QuizAttemptPartDto[];
}

const textOf = (parts: readonly QuizAttemptPartDto[], id: number) =>
  parts.find(part => part.id === id)?.text ?? '';

const pairsOf = (parts: Parts, pairs: readonly { prompt: number; answer: number }[]) =>
  pairs.map(
    pair =>
      `${textOf(parts.prompts, pair.prompt)} → ${textOf(parts.answers, pair.answer)}`,
  );

export function describeAnswer(parts: Parts, response: QuizAnswerDto | null): Described {
  if (response === null) return { texts: [], value: null };
  if (response.choice !== null)
    return { texts: [textOf(parts.choices, response.choice)], value: null };
  if (response.choices !== null) {
    return { texts: response.choices.map(id => textOf(parts.choices, id)), value: null };
  }
  if (response.pairs !== null)
    return { texts: pairsOf(parts, response.pairs), value: null };
  if (response.text !== null) return { texts: [response.text], value: null };

  return { texts: [], value: response.value };
}

export function describeKey(parts: Parts, key: QuizRevealedKeyDto): Described {
  if (key.choices !== null) {
    return {
      texts: parts.choices
        .filter(part => key.choices?.includes(part.id))
        .map(part => part.text),
      value: null,
    };
  }
  if (key.pairs !== null) {
    const order = parts.prompts.map(part => part.id);
    const pairs = [...key.pairs].sort(
      (a, b) => order.indexOf(a.prompt) - order.indexOf(b.prompt),
    );

    return { texts: pairsOf(parts, pairs), value: null };
  }
  if (key.texts !== null) return { texts: key.texts, value: null };
  if (key.number !== null) {
    return {
      texts: [key.tolerance ? `${key.number} ± ${key.tolerance}` : String(key.number)],
      value: null,
    };
  }

  return { texts: [], value: key.value };
}
