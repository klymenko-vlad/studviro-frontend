'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  describeAnswer,
  describeKey,
  quizMutations,
  quizQueries,
  type Described,
  type MarkedQuestion,
} from '@/entities/quiz';
import { toApiError } from '@/shared/api';
import { Alert, AlertDescription, Card, CardContent, ListSkeleton } from '@/shared/ui';

import { QuestionMarkForm, type QuestionMark } from './question-mark-form';

export function AttemptMarking({
  institutionId,
  spaceId,
  quizId,
  attemptId,
}: {
  institutionId: string;
  spaceId: string;
  quizId: string;
  attemptId: string;
}) {
  const t = useTranslations('quiz.marking');
  const tReview = useTranslations('quiz.review');
  const tQuestion = useTranslations('quiz.take.question');
  const format = useFormatter();
  const queryClient = useQueryClient();
  const path = { institutionId, spaceId, quizId, attemptId };
  const options = quizQueries.marking({ path });
  const marking = useQuery(options);

  const save = useMutation({
    ...quizMutations.markQuestion(),
    onSuccess: async updated => {
      queryClient.setQueryData(options.queryKey, updated);
      toast.success(t('saved'));
      await queryClient.invalidateQueries({
        queryKey: quizQueries.attemptsKey({ path: { institutionId, spaceId, quizId } }),
      });
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  if (marking.isPending) return <ListSkeleton items={3} />;
  if (marking.data === undefined) {
    return (
      <Alert>
        <AlertDescription>{t('error')}</AlertDescription>
      </Alert>
    );
  }

  const { score, student, questions } = marking.data;
  const shown = (described: Described) =>
    described.value === null
      ? described.texts.length === 0
        ? t('none')
        : described.texts.join('; ')
      : tQuestion(described.value ? 'true' : 'false');
  const onSave = (question: MarkedQuestion) => (mark: QuestionMark) => {
    save.mutate({ path: { ...path, position: question.position }, body: mark });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-1">
          <p className="font-medium">
            {t('student', { name: student.displayName, number: marking.data.attempt })}
          </p>
          <p className="text-muted-foreground text-sm">{student.email}</p>
          <p role="status">
            {marking.data.state !== 'finished'
              ? t('running')
              : score.points === null
                ? t('awaiting', {
                    count: questions.filter(q => q.outcome === 'needs_marking').length,
                  })
                : t('total', {
                    points: format.number(score.points),
                    max: format.number(score.maxPoints),
                    raw: format.number(score.rawMarks ?? 0),
                    maxMarks: format.number(score.maxMarks),
                  })}
          </p>
        </CardContent>
      </Card>

      {questions.map((question, index) => (
        <Card key={question.position}>
          <CardContent>
            <section
              aria-labelledby={`marking-${question.position}`}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id={`marking-${question.position}`} className="text-lg font-semibold">
                  {tQuestion('heading', { number: index + 1 })}
                </h2>
                <span className="text-sm">
                  {question.awarded === null
                    ? tReview('outcome.needs_marking')
                    : tReview('awarded', {
                        awarded: format.number(question.awarded),
                        mark: format.number(question.mark),
                      })}
                </span>
              </div>
              <p>{question.text}</p>
              <dl className="grid gap-x-3 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
                <dt className="font-medium">{t('answer')}</dt>
                <dd className="whitespace-pre-wrap">
                  {shown(describeAnswer(question, question.response))}
                </dd>
                {question.key === null ? null : (
                  <>
                    <dt className="font-medium">{tReview('rightAnswer')}</dt>
                    <dd>{shown(describeKey(question, question.key))}</dd>
                  </>
                )}
                {question.outcome === null ? null : (
                  <>
                    <dt className="font-medium">{t('outcome')}</dt>
                    <dd>{tReview(`outcome.${question.outcome}`)}</dd>
                  </>
                )}
                {question.autoMark === null || question.manualMark === null ? null : (
                  <>
                    <dt className="font-medium">{t('automatic')}</dt>
                    <dd>{format.number(question.autoMark)}</dd>
                  </>
                )}
              </dl>
              <QuestionMarkForm
                key={`${question.manualMark}-${question.comment}`}
                question={question}
                pending={save.isPending}
                onSave={onSave(question)}
              />
            </section>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
