'use client';

import type { Ref } from 'react';
import { useTranslations } from 'next-intl';

import type { AttemptAnswer, AttemptQuestion } from '@/entities/quiz';
import { Button, Card, CardContent } from '@/shared/ui';

import type { SaveState } from '../model/use-answer-saver';
import { QuestionField } from './question-field';

export function QuestionCard({
  question,
  number,
  answer,
  saveState,
  disabled,
  headingRef,
  onChange,
  onRetry,
}: {
  question: AttemptQuestion;
  number: number;
  answer: AttemptAnswer | null;
  saveState: SaveState | undefined;
  disabled: boolean;
  headingRef: Ref<HTMLHeadingElement>;
  onChange: (answer: AttemptAnswer, typing?: boolean) => void;
  onRetry: () => void;
}) {
  const t = useTranslations('quiz.take');
  const headingId = `question-${question.position}`;

  return (
    <Card>
      <CardContent>
        <section aria-labelledby={headingId} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id={headingId}
              ref={headingRef}
              tabIndex={-1}
              className="scroll-mt-28 text-lg font-semibold outline-none"
            >
              {t('question.heading', { number })}
            </h2>
            <span className="text-muted-foreground text-sm">
              {t('question.marks', { count: question.mark })}
            </span>
          </div>
          <QuestionField
            question={question}
            answer={answer}
            disabled={disabled}
            onChange={onChange}
          />
          <div className="flex min-h-8 flex-wrap items-center gap-2 text-sm">
            <p
              role="status"
              className={
                saveState === 'error' ? 'text-destructive' : 'text-muted-foreground'
              }
            >
              {saveState === undefined ? '' : t(`save.${saveState}`)}
            </p>
            {saveState === 'error' ? (
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                {t('save.retry')}
              </Button>
            ) : null}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
