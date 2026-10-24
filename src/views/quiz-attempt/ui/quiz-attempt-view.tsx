'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { PageTrail } from '@/widgets/page-trail';
import { AttemptEnd, AttemptRunner } from '@/features/take-quiz';
import { courseOfferingHref, courseOfferingQueries } from '@/entities/course-offering';
import { outlineAnchor } from '@/entities/learning-section';
import { quizQueries, type QuizAttempt } from '@/entities/quiz';
import {
  Alert,
  AlertDescription,
  ListSkeleton,
  PageHeader,
  PageShell,
} from '@/shared/ui';

const RESYNC_MS = 60_000;

export function QuizAttemptView({
  institutionId,
  offeringId,
  spaceId,
  quizId,
  attemptId,
}: {
  institutionId: string;
  offeringId: string;
  spaceId: string;
  quizId: string;
  attemptId: string;
}) {
  const t = useTranslations('quiz.take');
  const queryClient = useQueryClient();
  const path = { institutionId, spaceId, quizId };
  const offering = useQuery(
    courseOfferingQueries.detail({ path: { institutionId, offeringId } }),
  );
  const quiz = useQuery(quizQueries.detail({ path }));
  const attemptOptions = quizQueries.attempt({ path: { ...path, attemptId } });
  const attempt = useQuery({
    ...attemptOptions,
    refetchInterval: query =>
      query.state.data?.state === 'in_progress' ? RESYNC_MS : false,
    refetchOnWindowFocus: true,
  });
  const content = courseOfferingHref(institutionId, offeringId, { section: 'materials' });
  const back = `${content}#${outlineAnchor('quiz', quizId)}`;

  const finished = async (closed: QuizAttempt) => {
    queryClient.setQueryData(attemptOptions.queryKey, closed);
    await queryClient.invalidateQueries({
      queryKey: quizQueries.myAttemptsKey({ path }),
    });
  };

  return (
    <PageShell>
      <PageTrail
        crumbs={[
          ...(offering.data === undefined
            ? []
            : [{ label: offering.data.course.title, href: content }]),
          ...(quiz.data === undefined ? [] : [{ label: quiz.data.name, href: back }]),
        ]}
        current={
          attempt.data === undefined ? '' : t('title', { number: attempt.data.attempt })
        }
      />

      {attempt.isPending ? (
        <ListSkeleton items={3} />
      ) : attempt.data === undefined ? (
        <Alert>
          <AlertDescription>{t('error')}</AlertDescription>
        </Alert>
      ) : (
        <>
          <PageHeader
            title={quiz.data?.name ?? t('title', { number: attempt.data.attempt })}
            description={t('title', { number: attempt.data.attempt })}
          />
          {attempt.data.state === 'finished' ? (
            <AttemptEnd attempt={attempt.data} backHref={back} />
          ) : (
            <AttemptRunner
              key={attempt.data.id}
              institutionId={institutionId}
              spaceId={spaceId}
              attempt={attempt.data}
              onFinished={closed => void finished(closed)}
            />
          )}
        </>
      )}
    </PageShell>
  );
}
