import type { Question, QuestionType } from '@/entities/question-bank';
import type { CreateQuestionDto } from '@/shared/api';

export interface ChoiceDraft {
  text: string;
  correct: boolean;
  feedback: string;
}

export interface PairDraft {
  prompt: string;
  answer: string;
}

export interface QuestionDraft {
  type: QuestionType;
  categoryId: string;
  name: string;
  text: string;
  defaultMark: string;
  generalFeedback: string;
  choices: ChoiceDraft[];
  correct: 'true' | 'false';
  trueFeedback: string;
  falseFeedback: string;
  acceptedAnswers: string;
  caseSensitive: boolean;
  value: string;
  tolerance: string;
  pairs: PairDraft[];
}

export type DraftIssue =
  | 'category'
  | 'name'
  | 'text'
  | 'defaultMark'
  | 'choicesEmpty'
  | 'oneCorrect'
  | 'someCorrect'
  | 'acceptedAnswers'
  | 'value'
  | 'tolerance'
  | 'pairs';

export const blankChoice = (): ChoiceDraft => ({
  text: '',
  correct: false,
  feedback: '',
});
export const blankPair = (): PairDraft => ({ prompt: '', answer: '' });

export function blankDraft(type: QuestionType, categoryId: string): QuestionDraft {
  return {
    type,
    categoryId,
    name: '',
    text: '',
    defaultMark: '1',
    generalFeedback: '',
    choices: [blankChoice(), blankChoice()],
    correct: 'true',
    trueFeedback: '',
    falseFeedback: '',
    acceptedAnswers: '',
    caseSensitive: false,
    value: '',
    tolerance: '',
    pairs: [blankPair(), blankPair()],
  };
}

export function draftOf(question: Question): QuestionDraft {
  const blank = blankDraft(question.type, question.categoryId);

  return {
    ...blank,
    name: question.name,
    text: question.text,
    defaultMark: String(question.defaultMark),
    generalFeedback: question.generalFeedback ?? '',
    choices:
      question.choices?.map(choice => ({ ...choice, feedback: choice.feedback ?? '' })) ??
      blank.choices,
    correct: question.correct === false ? 'false' : 'true',
    trueFeedback: question.trueFeedback ?? '',
    falseFeedback: question.falseFeedback ?? '',
    acceptedAnswers: question.acceptedAnswers?.join('\n') ?? '',
    caseSensitive: question.caseSensitive ?? false,
    value: question.value === null ? '' : String(question.value),
    tolerance: question.tolerance === null ? '' : String(question.tolerance),
    pairs: question.pairs ?? blank.pairs,
  };
}

const orNull = (value: string) => (value.trim() === '' ? null : value.trim());
const answersOf = (draft: QuestionDraft) =>
  draft.acceptedAnswers
    .split('\n')
    .map(answer => answer.trim())
    .filter(answer => answer !== '');
const isNumber = (value: string) => value.trim() !== '' && Number.isFinite(Number(value));

export function draftIssues(draft: QuestionDraft): DraftIssue[] {
  const issues: DraftIssue[] = [];
  if (draft.categoryId === '') issues.push('category');
  if (draft.name.trim() === '') issues.push('name');
  if (draft.text.trim() === '') issues.push('text');
  if (!(Number(draft.defaultMark) > 0)) issues.push('defaultMark');

  switch (draft.type) {
    case 'single_choice':
    case 'multiple_choice': {
      const filled = draft.choices.filter(choice => choice.text.trim() !== '');
      const correct = draft.choices.filter(choice => choice.correct).length;
      if (filled.length < 2 || filled.length !== draft.choices.length) {
        issues.push('choicesEmpty');
      }
      if (draft.type === 'single_choice' && correct !== 1) issues.push('oneCorrect');
      if (draft.type === 'multiple_choice' && correct < 1) issues.push('someCorrect');
      break;
    }
    case 'short_answer':
      if (answersOf(draft).length === 0) issues.push('acceptedAnswers');
      break;
    case 'numerical':
      if (!isNumber(draft.value)) issues.push('value');
      if (draft.tolerance.trim() !== '' && !(Number(draft.tolerance) >= 0)) {
        issues.push('tolerance');
      }
      break;
    case 'matching':
      if (
        draft.pairs.length < 2 ||
        draft.pairs.some(pair => pair.prompt.trim() === '' || pair.answer.trim() === '')
      ) {
        issues.push('pairs');
      }
      break;
    case 'true_false':
    case 'essay':
      break;
  }

  return issues;
}

export function toQuestionPayload(draft: QuestionDraft): CreateQuestionDto {
  const common = {
    type: draft.type,
    categoryId: draft.categoryId,
    name: draft.name.trim(),
    text: draft.text.trim(),
    defaultMark: Number(draft.defaultMark),
    generalFeedback: orNull(draft.generalFeedback),
  };

  switch (draft.type) {
    case 'single_choice':
    case 'multiple_choice':
      return {
        ...common,
        choices: draft.choices.map(choice => ({
          text: choice.text.trim(),
          correct: choice.correct,
          feedback: orNull(choice.feedback),
        })),
      };
    case 'true_false':
      return {
        ...common,
        correct: draft.correct === 'true',
        trueFeedback: orNull(draft.trueFeedback),
        falseFeedback: orNull(draft.falseFeedback),
      };
    case 'short_answer':
      return {
        ...common,
        acceptedAnswers: answersOf(draft),
        caseSensitive: draft.caseSensitive,
      };
    case 'numerical':
      return {
        ...common,
        value: Number(draft.value),
        tolerance: draft.tolerance.trim() === '' ? 0 : Number(draft.tolerance),
      };
    case 'matching':
      return {
        ...common,
        pairs: draft.pairs.map(pair => ({
          prompt: pair.prompt.trim(),
          answer: pair.answer.trim(),
        })),
      };
    case 'essay':
      return common;
  }
}
