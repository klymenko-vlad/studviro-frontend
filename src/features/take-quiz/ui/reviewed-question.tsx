'use client';

import { CircleCheck, CircleDashed, CircleMinus, CircleX } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import {
  answerOf,
  describeKey,
  type QuizReviewShown,
  type ReviewedQuestion as Reviewed,
} from '@/entities/quiz';
import { Card, CardContent } from '@/shared/ui';

import { QuestionField } from './question-field';

const ICONS = {
  right: CircleCheck,
  partial: CircleMinus,
  wrong: CircleX,
  not_answered: CircleX,
  needs_marking: CircleDashed,
} as const;

export function ReviewedQuestion({
  question,
  number,
  shown,
}: {
  question: Reviewed;
  number: number;
  shown: QuizReviewShown;
}) {
  const t = useTranslations('quiz.review');
  const tQuestion = useTranslations('quiz.take.question');
  const format = useFormatter();
  const headingId = `review-question-${question.position}`;
  const key = question.key === null ? null : describeKey(question, question.key);
  const Icon = question.outcome === null ? null : ICONS[question.outcome];

  return (
    <Card>
      <CardContent>
        <section aria-labelledby={headingId} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id={headingId} className="text-lg font-semibold">
              {tQuestion('heading', { number })}
            </h2>
            <span className="text-muted-foreground text-sm">
              {question.awarded === null
                ? tQuestion('marks', { count: question.mark })
                : t('awarded', {
                    awarded: format.number(question.awarded),
                    mark: format.number(question.mark),
                  })}
            </span>
          </div>

          {shown.responses ? (
            <QuestionField
              question={{ ...question, savedAt: null }}
              answer={answerOf(question.response)}
              disabled
              onChange={() => undefined}
            />
          ) : (
            <p className="text-base">{question.text}</p>
          )}

          {question.outcome === null || Icon === null ? null : (
            <p className="flex items-center gap-2 font-medium">
              <Icon
                aria-hidden
                className={
                  question.outcome === 'right'
                    ? 'text-primary size-5'
                    : 'text-muted-foreground size-5'
                }
              />
              {t(`outcome.${question.outcome}`)}
            </p>
          )}

          {key === null ? null : (
            <div className="text-sm">
              <p className="font-medium">{t('rightAnswer')}</p>
              {key.value === null ? (
                <ul className="list-disc pl-5">
                  {key.texts.map(text => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              ) : (
                <p>{tQuestion(key.value ? 'true' : 'false')}</p>
              )}
            </div>
          )}

          {[...question.specificFeedback, question.generalFeedback].map((text, index) =>
            text === null ? null : (
              <p key={index} className="bg-muted rounded-md p-3 text-sm">
                {text}
              </p>
            ),
          )}
          {question.comment === null ? null : (
            <p className="text-sm">
              <span className="font-medium">{t('comment')}</span> {question.comment}
            </p>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
