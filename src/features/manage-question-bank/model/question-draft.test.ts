import { describe, expect, it } from 'vitest';

import { bankQuestion } from '@/shared/test';

import { blankDraft, draftIssues, draftOf, toQuestionPayload } from './question-draft';

const named = (type: Parameters<typeof blankDraft>[0]) => ({
  ...blankDraft(type, 'cat'),
  name: 'Q',
  text: 'What?',
});

describe('a question draft', () => {
  it('starts with two empty choices and a mark of one', () => {
    expect(blankDraft('single_choice', 'cat')).toMatchObject({
      categoryId: 'cat',
      defaultMark: '1',
      choices: [
        { text: '', correct: false, feedback: '' },
        { text: '', correct: false, feedback: '' },
      ],
    });
  });

  it('sends only the fields of its own type', () => {
    const draft = {
      ...named('single_choice'),
      choices: [
        { text: 'a', correct: true, feedback: 'Yes' },
        { text: 'b', correct: false, feedback: '' },
      ],
      acceptedAnswers: 'stray',
    };

    expect(toQuestionPayload(draft)).toEqual({
      type: 'single_choice',
      categoryId: 'cat',
      name: 'Q',
      text: 'What?',
      defaultMark: 1,
      generalFeedback: null,
      choices: [
        { text: 'a', correct: true, feedback: 'Yes' },
        { text: 'b', correct: false, feedback: null },
      ],
    });
  });

  it('sends accepted answers one per line, and the numerical tolerance', () => {
    expect(
      toQuestionPayload({
        ...named('short_answer'),
        acceptedAnswers: 'BFS\n\n breadth-first \n',
      }),
    ).toMatchObject({ acceptedAnswers: ['BFS', 'breadth-first'], caseSensitive: false });
    expect(
      toQuestionPayload({ ...named('numerical'), value: '3.14', tolerance: '' }),
    ).toMatchObject({ value: 3.14, tolerance: 0 });
    expect(toQuestionPayload({ ...named('true_false'), correct: 'false' })).toMatchObject(
      {
        correct: false,
      },
    );
  });

  it('names what is missing before it is sent', () => {
    expect(draftIssues({ ...named('single_choice') })).toContain('choicesEmpty');
    expect(
      draftIssues({
        ...named('single_choice'),
        choices: [
          { text: 'a', correct: true, feedback: '' },
          { text: 'b', correct: true, feedback: '' },
        ],
      }),
    ).toContain('oneCorrect');
    expect(
      draftIssues({
        ...named('multiple_choice'),
        choices: [
          { text: 'a', correct: false, feedback: '' },
          { text: 'b', correct: false, feedback: '' },
        ],
      }),
    ).toContain('someCorrect');
    expect(draftIssues({ ...named('short_answer'), acceptedAnswers: ' ' })).toContain(
      'acceptedAnswers',
    );
    expect(draftIssues({ ...named('numerical'), value: 'x' })).toContain('value');
    expect(
      draftIssues({ ...named('matching'), pairs: [{ prompt: 'a', answer: 'b' }] }),
    ).toContain('pairs');
    expect(draftIssues({ ...named('essay'), name: '' })).toContain('name');
    expect(draftIssues({ ...named('essay'), defaultMark: '0' })).toContain('defaultMark');
    expect(draftIssues({ ...named('essay'), categoryId: '' })).toContain('category');
    expect(draftIssues(named('essay'))).toEqual([]);
  });

  it('reads a stored question back into a draft', () => {
    expect(draftOf(bankQuestion)).toMatchObject({
      type: 'single_choice',
      categoryId: bankQuestion.categoryId,
      name: 'Binary search cost',
      defaultMark: '1',
      generalFeedback: 'It halves the range.',
      choices: [
        { text: 'Θ(log n)', correct: true, feedback: '' },
        { text: 'Θ(n)', correct: false, feedback: 'That is a scan.' },
      ],
    });
  });
});
