'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';

import type { AttemptAnswer, AttemptQuestion } from '@/entities/quiz';
import { Choice, Input, Label, Select, SelectItem, Textarea } from '@/shared/ui';

export function QuestionField({
  question,
  answer,
  disabled,
  onChange,
}: {
  question: AttemptQuestion;
  answer: AttemptAnswer | null;
  disabled: boolean;
  onChange: (answer: AttemptAnswer, typing?: boolean) => void;
}) {
  const t = useTranslations('quiz.take.question');
  const id = useId();
  const name = `question-${question.position}`;
  const legend = <legend className="mb-3 text-base">{question.text}</legend>;

  switch (question.type) {
    case 'single_choice':
      return (
        <fieldset disabled={disabled}>
          {legend}
          <div className="flex flex-col gap-2">
            {question.choices.map(choice => (
              <Choice
                key={choice.id}
                name={name}
                checked={answer?.choice === choice.id}
                onChange={() => {
                  onChange({ choice: choice.id });
                }}
              >
                {choice.text}
              </Choice>
            ))}
          </div>
        </fieldset>
      );
    case 'multiple_choice': {
      const picked = answer?.choices ?? [];

      return (
        <fieldset disabled={disabled} aria-describedby={`${id}-hint`}>
          {legend}
          <p id={`${id}-hint`} className="text-muted-foreground mb-2 text-sm">
            {t('pickAll')}
          </p>
          <div className="flex flex-col gap-2">
            {question.choices.map(choice => (
              <Choice
                key={choice.id}
                type="checkbox"
                checked={picked.includes(choice.id)}
                onChange={event => {
                  onChange({
                    choices: event.target.checked
                      ? [...picked, choice.id]
                      : picked.filter(other => other !== choice.id),
                  });
                }}
              >
                {choice.text}
              </Choice>
            ))}
          </div>
        </fieldset>
      );
    }
    case 'true_false':
      return (
        <fieldset disabled={disabled}>
          {legend}
          <div className="flex flex-col gap-2 sm:flex-row">
            {[true, false].map(value => (
              <Choice
                key={String(value)}
                name={name}
                className="sm:min-w-32"
                checked={answer?.value === value}
                onChange={() => {
                  onChange({ value });
                }}
              >
                {t(value ? 'true' : 'false')}
              </Choice>
            ))}
          </div>
        </fieldset>
      );
    case 'matching':
      return (
        <fieldset disabled={disabled}>
          {legend}
          <div className="flex flex-col gap-3">
            {question.prompts.map(prompt => {
              const pairs = answer?.pairs ?? [];
              const current = pairs.find(pair => pair.prompt === prompt.id);
              const selectId = `${id}-${prompt.id}`;

              return (
                <div
                  key={prompt.id}
                  className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center sm:gap-3"
                >
                  <Label htmlFor={selectId} className="leading-snug">
                    {prompt.text}
                  </Label>
                  <Select
                    id={selectId}
                    className="w-full"
                    value={current === undefined ? '' : String(current.answer)}
                    onValueChange={value => {
                      const others = pairs.filter(pair => pair.prompt !== prompt.id);
                      onChange({
                        pairs:
                          value === ''
                            ? others
                            : [...others, { prompt: prompt.id, answer: Number(value) }],
                      });
                    }}
                  >
                    <SelectItem value="">{t('choose')}</SelectItem>
                    {question.answers.map(option => (
                      <SelectItem key={option.id} value={String(option.id)}>
                        {option.text}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              );
            })}
          </div>
        </fieldset>
      );
    case 'essay':
      return (
        <div className="flex flex-col gap-2">
          <p className="text-base">{question.text}</p>
          <Label htmlFor={id}>{t('essay')}</Label>
          <Textarea
            id={id}
            rows={8}
            disabled={disabled}
            value={answer?.text ?? ''}
            onChange={event => {
              onChange({ text: event.target.value }, true);
            }}
          />
        </div>
      );
    case 'short_answer':
    case 'numerical': {
      const numerical = question.type === 'numerical';

      return (
        <div className="flex flex-col gap-2">
          <p className="text-base">{question.text}</p>
          <Label htmlFor={id}>{t(numerical ? 'number' : 'answer')}</Label>
          <Input
            id={id}
            className="sm:max-w-sm"
            autoComplete="off"
            inputMode={numerical ? 'decimal' : 'text'}
            disabled={disabled}
            aria-describedby={numerical ? `${id}-hint` : undefined}
            value={answer?.text ?? ''}
            onChange={event => {
              onChange({ text: event.target.value }, true);
            }}
          />
          {numerical ? (
            <p id={`${id}-hint`} className="text-muted-foreground text-sm">
              {t('numberHint')}
            </p>
          ) : null}
        </div>
      );
    }
  }
}
