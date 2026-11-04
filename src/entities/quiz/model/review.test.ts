import { describe, expect, it } from 'vitest';

import { describeAnswer, describeKey } from './review';

const part = (id: number, text: string) => ({ id, text });
const question = {
  choices: [part(1, 'Θ(n)'), part(0, 'Θ(log n)')],
  prompts: [part(1, 'Queue'), part(0, 'Stack')],
  answers: [part(1, 'FIFO'), part(0, 'LIFO')],
};
const empty = { choice: null, choices: null, value: null, text: null, pairs: null };
const noKey = {
  choices: null,
  value: null,
  texts: null,
  number: null,
  tolerance: null,
  pairs: null,
};

describe('reviewing an attempt', () => {
  it('describes an answer in the words the student saw', () => {
    expect(describeAnswer(question, { ...empty, choice: 0 })).toEqual({
      texts: ['Θ(log n)'],
      value: null,
    });
    expect(describeAnswer(question, { ...empty, choices: [1, 0] }).texts).toEqual([
      'Θ(n)',
      'Θ(log n)',
    ]);
    expect(describeAnswer(question, { ...empty, value: false })).toEqual({
      texts: [],
      value: false,
    });
    expect(describeAnswer(question, { ...empty, text: ' bfs ' }).texts).toEqual([
      ' bfs ',
    ]);
    expect(
      describeAnswer(question, { ...empty, pairs: [{ prompt: 0, answer: 0 }] }).texts,
    ).toEqual(['Stack → LIFO']);
    expect(describeAnswer(question, null)).toEqual({ texts: [], value: null });
  });

  it('describes the right answer of each type, pairs in the order they were shown', () => {
    expect(describeKey(question, { ...noKey, choices: [0] }).texts).toEqual(['Θ(log n)']);
    expect(describeKey(question, { ...noKey, value: true }).value).toBe(true);
    expect(describeKey(question, { ...noKey, texts: ['BFS', 'bfs'] }).texts).toEqual([
      'BFS',
      'bfs',
    ]);
    expect(describeKey(question, { ...noKey, number: 11, tolerance: 0.5 }).texts).toEqual(
      ['11 ± 0.5'],
    );
    expect(describeKey(question, { ...noKey, number: 11, tolerance: 0 }).texts).toEqual([
      '11',
    ]);
    expect(
      describeKey(question, {
        ...noKey,
        pairs: [
          { prompt: 0, answer: 0 },
          { prompt: 1, answer: 1 },
        ],
      }).texts,
    ).toEqual(['Queue → FIFO', 'Stack → LIFO']);
  });
});
