'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';

import { quizQueries, useWhen } from '@/entities/quiz';
import { Alert, AlertDescription, Card, CardContent, ListSkeleton } from '@/shared/ui';

import { ReviewedQuestion } from './reviewed-question';

export function AttemptReview({
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
  const t = useTranslations('quiz.review');
  const format = useFormatter();
  const when = useWhen();
  const review = useQuery(
    quizQueries.review({ path: { institutionId, spaceId, quizId, attemptId } }),
  );

  if (review.isPending) return <ListSkeleton items={2} />;
  if (review.data === undefined) {
    return (
      <Alert>
        <AlertDescription>{t('error')}</AlertDescription>
      </Alert>
    );
  }

  const { score, questions, shown, revealsAt } = review.data;

  return (
    <section aria-labelledby="attempt-review-title" className="flex flex-col gap-4">
      <h2 id="attempt-review-title" className="text-lg font-semibold">
        {t('title')}
      </h2>
      <Card>
        <CardContent className="flex flex-col gap-2">
          {score === null ? (
            <p>{t('markHidden')}</p>
          ) : score.points === null ? (
            <p>{t('awaitingMarking')}</p>
          ) : (
            <p className="text-lg font-medium">
              {t('mark', {
                points: format.number(score.points),
                max: format.number(score.maxPoints),
                raw: format.number(score.rawMarks ?? 0),
                maxMarks: format.number(score.maxMarks),
              })}
            </p>
          )}
          {revealsAt === null ? null : (
            <p className="text-muted-foreground text-sm">
              {t('revealsAt', { when: when(revealsAt) })}
            </p>
          )}
          {questions.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('noQuestions')}</p>
          ) : null}
        </CardContent>
      </Card>
      {questions.map((question, index) => (
        <ReviewedQuestion
          key={question.position}
          question={question}
          number={index + 1}
          shown={shown}
        />
      ))}
    </section>
  );
}
