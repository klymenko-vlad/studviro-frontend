import { describe, expect, it } from 'vitest';

import { answerOf, isAnswered, quizAttemptHref } from './attempt';

describe('a quiz attempt', () => {
  it('lives under its quiz', () => {
    expect(quizAttemptHref('i', 'o', 's', 'q', 'a')).toBe(
      '/institutions/i/courses/o/spaces/s/quizzes/q/attempts/a',
    );
  });

  it('turns a saved answer into what is sent back, without the empty fields', () => {
    expect(
      answerOf({ choice: 2, choices: null, value: null, text: null, pairs: null }),
    ).toEqual({ choice: 2 });
    expect(answerOf(null)).toBeNull();
  });

  it('counts an answer as given only when something was picked or written', () => {
    expect(isAnswered({ choice: 0 })).toBe(true);
    expect(isAnswered({ value: false })).toBe(true);
    expect(isAnswered({ choices: [] })).toBe(false);
    expect(isAnswered({ text: '   ' })).toBe(false);
    expect(isAnswered({ pairs: [{ prompt: 0, answer: 1 }] })).toBe(true);
    expect(isAnswered(null)).toBe(false);
  });
});
