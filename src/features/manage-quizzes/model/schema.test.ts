import { describe, expect, it } from 'vitest';

import { offeringQuizzes } from '@/shared/test';

import { EMPTY_QUIZ, quizFormSchema, toFormValues, toQuizPayload } from './schema';

const BRATISLAVA = 'Europe/Bratislava';
const base = { ...EMPTY_QUIZ, name: 'Week 1 quiz' };
const valid = (values: Partial<typeof base>) =>
  quizFormSchema.safeParse({ ...base, ...values }).success;

describe('the quiz settings form', () => {
  it('sends the window on the institution’s clock, with the close as closesAt', () => {
    expect(
      toQuizPayload(
        { ...base, opensAt: '2026-11-02T08:00', closesAt: '2026-11-09T23:59' },
        BRATISLAVA,
      ),
    ).toMatchObject({
      name: 'Week 1 quiz',
      opensAt: '2026-11-02T07:00:00.000Z',
      closesAt: '2026-11-09T22:59:00.000Z',
    });
  });

  it('sends one attempt, no time limit and 10 points by default', () => {
    expect(toQuizPayload(base, BRATISLAVA)).toMatchObject({
      maxAttempts: 1,
      timeLimitMinutes: null,
      maxPoints: 10,
      gradingMethod: 'highest',
      shuffleQuestions: false,
      shuffleChoices: true,
      layout: 'one_per_page',
    });
  });

  it('sends every question on one page when the author asks for it', () => {
    expect(toQuizPayload({ ...base, layout: 'all_on_one' }, BRATISLAVA)).toMatchObject({
      layout: 'all_on_one',
    });
  });

  it('keeps the right answers back until the quiz closes by default, and sends what the author picks', () => {
    expect(toQuizPayload(base, BRATISLAVA).review).toEqual({
      responses: 'immediately',
      correctness: 'immediately',
      correctAnswer: 'after_close',
      feedback: 'immediately',
      overallMark: 'immediately',
    });
    expect(
      toQuizPayload(
        { ...base, review: { ...base.review, overallMark: 'never' } },
        BRATISLAVA,
      ).review.overallMark,
    ).toBe('never');
    expect(valid({ review: { ...base.review, feedback: 'later' as 'never' } })).toBe(
      false,
    );
  });

  it('reads the review options a quiz has, and the defaults when it shows none', () => {
    const quiz = offeringQuizzes[0]!;
    expect(toFormValues(quiz, BRATISLAVA).review).toEqual(quiz.settings!.review);
    expect(toFormValues({ ...quiz, settings: null }, BRATISLAVA).review).toEqual(
      EMPTY_QUIZ.review,
    );
  });

  it('sends unlimited attempts and no time limit for empty fields', () => {
    expect(
      toQuizPayload({ ...base, maxAttempts: '', timeLimitMinutes: '' }, BRATISLAVA),
    ).toMatchObject({ maxAttempts: null, timeLimitMinutes: null });
  });

  it('refuses a close before the opening, and limits out of range', () => {
    expect(valid({ opensAt: '2026-11-09T08:00', closesAt: '2026-11-02T08:00' })).toBe(
      false,
    );
    expect(valid({ opensAt: '2026-11-09T08:00', closesAt: '2026-11-09T08:00' })).toBe(
      false,
    );
    expect(valid({ timeLimitMinutes: '0' })).toBe(false);
    expect(valid({ timeLimitMinutes: '1441' })).toBe(false);
    expect(valid({ timeLimitMinutes: '1440' })).toBe(true);
    expect(valid({ maxAttempts: '0' })).toBe(false);
    expect(valid({ maxAttempts: '101' })).toBe(false);
    expect(valid({ maxPoints: '0' })).toBe(false);
    expect(valid({ name: '' })).toBe(false);
  });

  it('asks for a pass mark no higher than the quiz is worth', () => {
    expect(valid({ completionRule: 'passed', completionPassPoints: '' })).toBe(false);
    expect(valid({ completionRule: 'passed', completionPassPoints: '11' })).toBe(false);
    expect(valid({ completionRule: 'passed', completionPassPoints: '10' })).toBe(true);
  });

  it('reads an existing quiz back into the form', () => {
    expect(toFormValues(offeringQuizzes[0]!, BRATISLAVA)).toMatchObject({
      name: 'Foundations quiz',
      opensAt: '2026-10-05T09:00',
      closesAt: '2026-12-01T00:00',
      timeLimitMinutes: '10',
      maxAttempts: '2',
      maxPoints: '10',
      gradingMethod: 'highest',
    });
  });
});
