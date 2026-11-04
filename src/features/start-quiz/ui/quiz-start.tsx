'use client';

import { useEffect, useId, useState } from 'react';
import { keepPreviousData, useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  QUIZ_ATTEMPT_PROGRESS,
  quizAttemptHref,
  quizMutations,
  quizQueries,
  useWhen,
  type Quiz,
} from '@/entities/quiz';
import { toApiError } from '@/shared/api';
import { Link, useRouter } from '@/shared/config';
import { Button, Label, LoadMore, Select, SelectItem } from '@/shared/ui';

const PAGE = 5;
type Progress = (typeof QUIZ_ATTEMPT_PROGRESS)[number];

export function QuizStart({
  institutionId,
  offeringId,
  spaceId,
  quiz,
}: {
  institutionId: string;
  offeringId: string;
  spaceId: string;
  quiz: Quiz;
}) {
  const t = useTranslations('quiz.take');
  const when = useWhen();
  const format = useFormatter();
  const filterId = useId();
  const [state, setState] = useState<Progress | ''>('');
  const path = { institutionId, spaceId, quizId: quiz.id };
  const href = (attemptId: string) =>
    quizAttemptHref(institutionId, offeringId, spaceId, quiz.id, attemptId);

  const mine = useInfiniteQuery({
    ...quizQueries.myAttempts({
      path,
      query: { limit: PAGE, ...(state === '' ? {} : { state }) },
    }),
    placeholderData: keepPreviousData,
  });
  const start = useMutation({
    ...quizMutations.startAttempt(),
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  const first = mine.data?.pages[0];
  if (first === undefined) return null;

  const { standing } = first;
  const rows = mine.data?.pages.flatMap(page => page.items) ?? [];
  const left =
    standing.maxAttempts === null
      ? null
      : Math.max(0, standing.maxAttempts - standing.used);

  return (
    <div className="flex flex-col gap-3">
      {start.data === undefined ? null : <OpenAttempt href={href(start.data.id)} />}
      <div className="flex flex-wrap items-center gap-3">
        {standing.inProgressId !== null ? (
          <Button asChild size="sm">
            <Link href={href(standing.inProgressId)}>{t('continue')}</Link>
          </Button>
        ) : standing.blockedBy === null ? (
          <Button
            type="button"
            size="sm"
            disabled={start.isPending || start.isSuccess}
            onClick={() => {
              start.mutate({ path });
            }}
          >
            {start.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {t('start')}
          </Button>
        ) : null}
        <p className="text-muted-foreground text-sm" role="status">
          {standing.blockedBy === 'upcoming' && quiz.opensAt !== null
            ? t('blocked.upcoming', { when: when(quiz.opensAt) })
            : standing.blockedBy !== null && standing.blockedBy !== 'upcoming'
              ? t(`blocked.${standing.blockedBy}`)
              : left === null
                ? t('open')
                : t('left', { count: left })}
        </p>
      </div>

      {standing.used === 0 ? null : (
        <section className="flex flex-col gap-2" aria-labelledby={`${filterId}-title`}>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h3 id={`${filterId}-title`} className="text-sm font-medium">
              {t('mine.title')}
            </h3>
            <div className="flex items-center gap-2">
              <Label htmlFor={filterId} className="text-muted-foreground font-normal">
                {t('mine.filter')}
              </Label>
              <Select
                id={filterId}
                uiSize="sm"
                value={state}
                onValueChange={value => {
                  setState(QUIZ_ATTEMPT_PROGRESS.find(option => option === value) ?? '');
                }}
              >
                <SelectItem value="">{t('mine.all')}</SelectItem>
                {QUIZ_ATTEMPT_PROGRESS.map(option => (
                  <SelectItem key={option} value={option}>
                    {t(`mine.${option}`)}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('mine.noMatch')}</p>
          ) : (
            <ul
              className="flex flex-col gap-1 text-sm"
              aria-label={t('mine.label', { name: quiz.name })}
            >
              {rows.map(attempt => (
                <li key={attempt.id} className="flex flex-wrap gap-x-2">
                  <span className="font-medium">
                    {t('mine.row', { number: attempt.attempt })}
                  </span>
                  <span className="text-muted-foreground">
                    {attempt.finishedAt === null
                      ? t('mine.started', { when: when(attempt.startedAt) })
                      : t('mine.submitted', { when: when(attempt.finishedAt) })}
                  </span>
                  {attempt.review.score === null ? null : (
                    <span className="tabular-nums">
                      {attempt.review.score.points === null
                        ? t('mine.awaiting')
                        : t('mine.score', {
                            points: format.number(attempt.review.score.points),
                            max: format.number(attempt.review.score.maxPoints),
                          })}
                    </span>
                  )}
                  {attempt.review.available ? (
                    <Link href={href(attempt.id)} className="text-primary underline">
                      {t('mine.review', { number: attempt.attempt })}
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <LoadMore
            shown={rows.length}
            hasMore={mine.hasNextPage}
            pending={mine.isFetchingNextPage}
            onLoadMore={() => void mine.fetchNextPage()}
          />
        </section>
      )}
    </div>
  );
}

function OpenAttempt({ href }: { href: string }) {
  const router = useRouter();

  useEffect(() => {
    router.push(href);
  }, [router, href]);

  return null;
}
