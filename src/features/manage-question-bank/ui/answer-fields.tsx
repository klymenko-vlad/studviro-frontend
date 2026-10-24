'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';

import { Button, Input, Label, Select, SelectItem, Switch, Textarea } from '@/shared/ui';

import {
  blankChoice,
  blankPair,
  type ChoiceDraft,
  type PairDraft,
  type QuestionDraft,
} from '../model/question-draft';

const MAX_ROWS = 20;

export function AnswerFields({
  draft,
  onChange,
}: {
  draft: QuestionDraft;
  onChange: (changes: Partial<QuestionDraft>) => void;
}) {
  const t = useTranslations('questionBank.editor');
  const id = useId();

  switch (draft.type) {
    case 'single_choice':
    case 'multiple_choice': {
      const setChoice = (index: number, changes: Partial<ChoiceDraft>) => {
        const single = draft.type === 'single_choice' && changes.correct === true;
        onChange({
          choices: draft.choices.map((choice, at) =>
            at === index
              ? { ...choice, ...changes }
              : single
                ? { ...choice, correct: false }
                : choice,
          ),
        });
      };

      return (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium">
            {draft.type === 'single_choice' ? t('choicesSingle') : t('choicesMultiple')}
          </legend>
          <ol className="flex flex-col gap-3">
            {draft.choices.map((choice, index) => (
              <li key={index} className="flex flex-col gap-2 rounded-md border p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    aria-label={t('choiceText', { number: index + 1 })}
                    className="min-w-0 flex-1"
                    value={choice.text}
                    onChange={event => {
                      setChoice(index, { text: event.target.value });
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`${id}-correct-${index}`}
                      checked={choice.correct}
                      onCheckedChange={correct => {
                        setChoice(index, { correct });
                      }}
                    />
                    <Label htmlFor={`${id}-correct-${index}`}>{t('correct')}</Label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={draft.choices.length <= 2}
                    aria-label={t('removeChoice', { number: index + 1 })}
                    onClick={() => {
                      onChange({
                        choices: draft.choices.filter((_, at) => at !== index),
                      });
                    }}
                  >
                    {t('remove')}
                  </Button>
                </div>
                <Input
                  aria-label={t('choiceFeedback', { number: index + 1 })}
                  placeholder={t('feedbackPlaceholder')}
                  value={choice.feedback}
                  onChange={event => {
                    setChoice(index, { feedback: event.target.value });
                  }}
                />
              </li>
            ))}
          </ol>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            disabled={draft.choices.length >= MAX_ROWS}
            onClick={() => {
              onChange({ choices: [...draft.choices, blankChoice()] });
            }}
          >
            {t('addChoice')}
          </Button>
        </fieldset>
      );
    }
    case 'true_false':
      return (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${id}-tf`}>{t('statementIs')}</Label>
            <Select
              id={`${id}-tf`}
              value={draft.correct}
              onValueChange={value => {
                onChange({ correct: value === 'false' ? 'false' : 'true' });
              }}
            >
              <SelectItem value="true">{t('true')}</SelectItem>
              <SelectItem value="false">{t('false')}</SelectItem>
            </Select>
          </div>
          {(['trueFeedback', 'falseFeedback'] as const).map(name => (
            <div key={name} className="flex flex-col gap-1">
              <Label htmlFor={`${id}-${name}`}>{t(name)}</Label>
              <Input
                id={`${id}-${name}`}
                value={draft[name]}
                onChange={event => {
                  onChange({ [name]: event.target.value });
                }}
              />
            </div>
          ))}
        </div>
      );
    case 'short_answer':
      return (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${id}-answers`}>{t('acceptedAnswers')}</Label>
            <Textarea
              id={`${id}-answers`}
              rows={3}
              value={draft.acceptedAnswers}
              onChange={event => {
                onChange({ acceptedAnswers: event.target.value });
              }}
            />
            <p className="text-muted-foreground text-xs">{t('acceptedAnswersHint')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id={`${id}-case`}
              checked={draft.caseSensitive}
              onCheckedChange={caseSensitive => {
                onChange({ caseSensitive });
              }}
            />
            <Label htmlFor={`${id}-case`}>{t('caseSensitive')}</Label>
          </div>
        </div>
      );
    case 'numerical':
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {(['value', 'tolerance'] as const).map(name => (
            <div key={name} className="flex flex-col gap-1">
              <Label htmlFor={`${id}-${name}`}>{t(name)}</Label>
              <Input
                id={`${id}-${name}`}
                type="number"
                step="any"
                inputMode="decimal"
                value={draft[name]}
                onChange={event => {
                  onChange({ [name]: event.target.value });
                }}
              />
            </div>
          ))}
        </div>
      );
    case 'matching': {
      const setPair = (index: number, changes: Partial<PairDraft>) => {
        onChange({
          pairs: draft.pairs.map((pair, at) =>
            at === index ? { ...pair, ...changes } : pair,
          ),
        });
      };

      return (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium">{t('pairs')}</legend>
          <ol className="flex flex-col gap-2">
            {draft.pairs.map((pair, index) => (
              <li key={index} className="flex flex-wrap items-center gap-2">
                <Input
                  aria-label={t('pairPrompt', { number: index + 1 })}
                  placeholder={t('promptPlaceholder')}
                  className="min-w-0 flex-1"
                  value={pair.prompt}
                  onChange={event => {
                    setPair(index, { prompt: event.target.value });
                  }}
                />
                <Input
                  aria-label={t('pairAnswer', { number: index + 1 })}
                  placeholder={t('answerPlaceholder')}
                  className="min-w-0 flex-1"
                  value={pair.answer}
                  onChange={event => {
                    setPair(index, { answer: event.target.value });
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={draft.pairs.length <= 2}
                  aria-label={t('removePair', { number: index + 1 })}
                  onClick={() => {
                    onChange({ pairs: draft.pairs.filter((_, at) => at !== index) });
                  }}
                >
                  {t('remove')}
                </Button>
              </li>
            ))}
          </ol>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            disabled={draft.pairs.length >= MAX_ROWS}
            onClick={() => {
              onChange({ pairs: [...draft.pairs, blankPair()] });
            }}
          >
            {t('addPair')}
          </Button>
        </fieldset>
      );
    }
    case 'essay':
      return <p className="text-muted-foreground text-sm">{t('essayNote')}</p>;
  }
}
