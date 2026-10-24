'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { isAnswered, quizMutations, type QuizAttempt } from '@/entities/quiz';
import { cn } from '@/shared/lib';
import { Alert, AlertDescription, Button } from '@/shared/ui';

import { useAnswerSaver, type AttemptPath } from '../model/use-answer-saver';
import { useCountdown } from '../model/use-countdown';
import { AttemptTimer } from './attempt-timer';
import { QuestionCard } from './question-card';
import { SubmitConfirmation } from './submit-confirmation';

export function AttemptRunner({
  institutionId,
  spaceId,
  attempt,
  onFinished,
}: {
  institutionId: string;
  spaceId: string;
  attempt: QuizAttempt;
  onFinished: (attempt: QuizAttempt) => void;
}) {
  const t = useTranslations('quiz.take');
  const path: AttemptPath = {
    institutionId,
    spaceId,
    quizId: attempt.quizId,
    attemptId: attempt.id,
  };
  const { questions } = attempt;
  const onePerPage = attempt.layout === 'one_per_page';
  const [page, setPage] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const headings = useRef(new Map<number, HTMLHeadingElement>());
  const focusNext = useRef<number | null>(null);
  const countdown = useCountdown(attempt.remainingSeconds);

  const submit = useMutation({
    ...quizMutations.submitAttempt(),
    onSuccess: onFinished,
  });
  const saver = useAnswerSaver({
    path,
    questions,
    onSaved: countdown.sync,
    onClosed: () => {
      submit.mutate({ path });
    },
  });

  const finish = async () => {
    if (submit.isPending || submit.isSuccess) return;
    await saver.flush();
    submit.mutate({ path });
  };
  const finishLatest = useRef(finish);
  useEffect(() => {
    finishLatest.current = finish;
  });

  const expired = countdown.left === 0;
  useEffect(() => {
    if (expired) void finishLatest.current();
  }, [expired]);

  useEffect(() => {
    if (focusNext.current === null) return;
    headings.current.get(focusNext.current)?.focus();
    focusNext.current = null;
  });

  const goTo = (index: number) => {
    const question = questions[index];
    if (!question) return;
    setConfirming(false);
    if (onePerPage) setPage(index);
    focusNext.current = question.position;
    headings.current.get(question.position)?.focus();
  };

  const answered = questions.map(question =>
    isAnswered(saver.answers[question.position] ?? null),
  );
  const unanswered = answered.flatMap((done, index) => (done ? [] : [index + 1]));
  const shown = onePerPage ? questions.slice(page, page + 1) : questions;
  const locked = expired || submit.isPending;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-md sm:border">
        <AttemptTimer left={countdown.left} />
        <p className="text-muted-foreground text-sm">
          {t('nav.progress', {
            answered: questions.length - unanswered.length,
            total: questions.length,
          })}
        </p>
      </div>

      {attempt.missingQuestions > 0 ? (
        <Alert>
          <AlertDescription>
            {t('missing', { count: attempt.missingQuestions })}
          </AlertDescription>
        </Alert>
      ) : null}

      <nav aria-label={t('nav.label')}>
        <ol className="flex flex-wrap gap-2">
          {questions.map((question, index) => (
            <li key={question.position}>
              <Button
                type="button"
                size="sm"
                variant={answered[index] ? 'secondary' : 'outline'}
                className={cn(
                  'min-w-11',
                  onePerPage && !confirming && index === page && 'ring-ring ring-2',
                )}
                aria-current={
                  onePerPage && !confirming && index === page ? 'step' : undefined
                }
                aria-label={t('nav.item', {
                  number: index + 1,
                  state: t(answered[index] ? 'nav.answered' : 'nav.unanswered'),
                })}
                onClick={() => {
                  goTo(index);
                }}
              >
                {index + 1}
              </Button>
            </li>
          ))}
        </ol>
      </nav>

      {submit.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{t('submitError')}</AlertDescription>
        </Alert>
      ) : null}

      {confirming ? (
        <SubmitConfirmation
          unanswered={unanswered}
          pending={submit.isPending}
          onGoTo={number => {
            goTo(number - 1);
          }}
          onSubmit={() => void finish()}
          onBack={() => {
            goTo(onePerPage ? page : 0);
          }}
        />
      ) : (
        <>
          {shown.map(question => {
            const index = questions.indexOf(question);

            return (
              <QuestionCard
                key={question.position}
                question={question}
                number={index + 1}
                answer={saver.answers[question.position] ?? null}
                saveState={saver.states[question.position]}
                disabled={locked}
                headingRef={element => {
                  if (element) headings.current.set(question.position, element);
                  else headings.current.delete(question.position);
                }}
                onChange={(answer, typing) => {
                  saver.change(question.position, answer, typing);
                }}
                onRetry={() => void saver.retry(question.position)}
              />
            );
          })}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            {onePerPage ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  disabled={page === 0}
                  onClick={() => {
                    goTo(page - 1);
                  }}
                >
                  {t('previous')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  disabled={page === questions.length - 1}
                  onClick={() => {
                    goTo(page + 1);
                  }}
                >
                  {t('next')}
                </Button>
              </div>
            ) : (
              <span />
            )}
            <Button
              type="button"
              disabled={locked}
              onClick={() => {
                setConfirming(true);
              }}
            >
              {t('finish')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
