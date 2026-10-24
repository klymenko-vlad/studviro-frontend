import { z } from 'zod';

import {
  AVAILABILITY_ORDER_ISSUE,
  availabilityFormShape,
  availabilityInOrder,
  EMPTY_AVAILABILITY,
  toAvailabilityPayload,
  toAvailabilityValues,
} from '@/entities/availability';
import { ASSIGNMENT_COMPLETION_RULES } from '@/entities/completion';
import {
  QUIZ_GRADING_METHODS,
  QUIZ_LAYOUTS,
  QUIZ_REVIEW_TIMINGS,
  type Quiz,
} from '@/entities/quiz';
import { apiSchemas } from '@/shared/api';
import { fromLocalInput, toLocalInput } from '@/shared/lib';

const moment = z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/u, 'Use a date and a time'),
  z.literal(''),
]);
const whole = z.string().regex(/^\d*$/u, 'Use a whole number');
const inRange = (value: string, low: number, high: number) =>
  value === '' || (Number(value) >= low && Number(value) <= high);

export const quizFormSchema = z
  .object({
    name: apiSchemas.zCreateQuizDto.shape.name,
    brief: z.string().max(20_000),
    opensAt: moment,
    closesAt: moment,
    timeLimitMinutes: whole,
    maxAttempts: whole,
    gradingMethod: z.enum(QUIZ_GRADING_METHODS),
    shuffleQuestions: z.boolean(),
    shuffleChoices: z.boolean(),
    layout: z.enum(QUIZ_LAYOUTS),
    review: z.object({
      responses: z.enum(QUIZ_REVIEW_TIMINGS),
      correctness: z.enum(QUIZ_REVIEW_TIMINGS),
      correctAnswer: z.enum(QUIZ_REVIEW_TIMINGS),
      feedback: z.enum(QUIZ_REVIEW_TIMINGS),
      overallMark: z.enum(QUIZ_REVIEW_TIMINGS),
    }),
    maxPoints: z.string().regex(/^\d+(\.\d+)?$/u, 'Use a number of points'),
    countsTowardFinalGrade: z.boolean(),
    visible: z.boolean(),
    completionRule: z.enum(ASSIGNMENT_COMPLETION_RULES),
    completionPassPoints: z.string().regex(/^\d*(\.\d+)?$/u, 'Use a number of points'),
    ...availabilityFormShape,
  })
  .refine(availabilityInOrder, AVAILABILITY_ORDER_ISSUE)
  .refine(
    values =>
      values.opensAt === '' || values.closesAt === '' || values.closesAt > values.opensAt,
    { path: ['closesAt'], message: 'A quiz closes after it opens' },
  )
  .refine(values => inRange(values.timeLimitMinutes, 1, 1440), {
    path: ['timeLimitMinutes'],
    message: 'Between 1 and 1440 minutes, or empty for no limit',
  })
  .refine(values => inRange(values.maxAttempts, 1, 100), {
    path: ['maxAttempts'],
    message: 'Between 1 and 100 attempts, or empty for unlimited',
  })
  .refine(values => Number(values.maxPoints) > 0, {
    path: ['maxPoints'],
    message: 'A quiz is worth more than nothing',
  })
  .refine(
    values => values.completionRule !== 'passed' || values.completionPassPoints !== '',
    { path: ['completionPassPoints'], message: 'Say how many points pass' },
  )
  .refine(
    values =>
      values.completionRule !== 'passed' ||
      values.completionPassPoints === '' ||
      Number(values.completionPassPoints) <= Number(values.maxPoints),
    {
      path: ['completionPassPoints'],
      message: 'The pass mark is above what the quiz is worth',
    },
  );

export type QuizFormValues = z.infer<typeof quizFormSchema>;

export const DEFAULT_REVIEW: QuizFormValues['review'] = {
  responses: 'immediately',
  correctness: 'immediately',
  correctAnswer: 'after_close',
  feedback: 'immediately',
  overallMark: 'immediately',
};

export const EMPTY_QUIZ: QuizFormValues = {
  name: '',
  brief: '',
  opensAt: '',
  closesAt: '',
  timeLimitMinutes: '',
  maxAttempts: '1',
  gradingMethod: 'highest',
  shuffleQuestions: false,
  shuffleChoices: true,
  layout: 'one_per_page',
  review: DEFAULT_REVIEW,
  maxPoints: '10',
  countsTowardFinalGrade: true,
  visible: false,
  completionRule: 'none',
  completionPassPoints: '',
  ...EMPTY_AVAILABILITY,
};

const text = (value: number | null | undefined) =>
  value === null || value === undefined ? '' : String(value);

export function toFormValues(quiz: Quiz, timeZone: string): QuizFormValues {
  return {
    name: quiz.name,
    brief: quiz.brief ?? '',
    opensAt: toLocalInput(quiz.opensAt, timeZone),
    closesAt: toLocalInput(quiz.closesAt, timeZone),
    timeLimitMinutes: text(quiz.settings?.timeLimitMinutes),
    maxAttempts: text(quiz.settings?.maxAttempts),
    gradingMethod: quiz.settings?.gradingMethod ?? 'highest',
    shuffleQuestions: quiz.settings?.shuffleQuestions ?? false,
    shuffleChoices: quiz.settings?.shuffleChoices ?? true,
    layout: quiz.settings?.layout ?? 'one_per_page',
    review: quiz.settings?.review ?? DEFAULT_REVIEW,
    maxPoints: String(quiz.maxPoints),
    countsTowardFinalGrade: quiz.countsTowardFinalGrade,
    visible: quiz.visible,
    completionRule:
      ASSIGNMENT_COMPLETION_RULES.find(rule => rule === quiz.completionRule) ?? 'none',
    completionPassPoints: text(quiz.completionPassPoints),
    ...toAvailabilityValues(quiz, timeZone),
  };
}

export function toQuizPayload(values: QuizFormValues, timeZone: string) {
  const count = (value: string) => (value === '' ? null : Number(value));

  return {
    name: values.name,
    brief: values.brief === '' ? null : values.brief,
    opensAt: fromLocalInput(values.opensAt, timeZone),
    closesAt: fromLocalInput(values.closesAt, timeZone),
    timeLimitMinutes: count(values.timeLimitMinutes),
    maxAttempts: count(values.maxAttempts),
    gradingMethod: values.gradingMethod,
    shuffleQuestions: values.shuffleQuestions,
    shuffleChoices: values.shuffleChoices,
    layout: values.layout,
    review: values.review,
    maxPoints: Number(values.maxPoints),
    countsTowardFinalGrade: values.countsTowardFinalGrade,
    visible: values.visible,
    completionRule: values.completionRule,
    completionPassPoints:
      values.completionRule === 'passed' && values.completionPassPoints !== ''
        ? Number(values.completionPassPoints)
        : null,
    ...toAvailabilityPayload(values, timeZone),
  };
}
