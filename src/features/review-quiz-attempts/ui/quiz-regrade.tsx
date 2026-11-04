'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { quizMutations, quizQueries, type Quiz } from '@/entities/quiz';
import { toApiError } from '@/shared/api';
import { Alert, AlertDescription, AlertTitle, Button } from '@/shared/ui';

export function QuizRegrade({
  institutionId,
  spaceId,
  quiz,
}: {
  institutionId: string;
  spaceId: string;
  quiz: Quiz;
}) {
  const t = useTranslations('quiz.regrade');
  const format = useFormatter();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const path = { institutionId, spaceId, quizId: quiz.id };
  const preview = useQuery(quizQueries.regrade({ path }));

  const regrade = useMutation({
    ...quizMutations.regrade(),
    onSuccess: async summary => {
      toast.success(t('done', { count: summary.changedStudents }));
      setConfirming(false);
      await Promise.all(
        [
          quizQueries.regradeKey({ path }),
          quizQueries.attemptsKey({ path }),
          quizQueries.resultsKey({ path }),
        ].map(queryKey => queryClient.invalidateQueries({ queryKey })),
      );
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  const summary = preview.data;
  if (summary === undefined || summary.outdatedAttempts === 0) return null;

  return (
    <Alert>
      <AlertTitle>{t('title')}</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>{t('outdated', { count: summary.outdatedAttempts })}</p>
        {summary.regradedAttempts === 0 ? null : (
          <p>
            {t('preview', {
              attempts: summary.changedAttempts,
              students: summary.changedStudents,
            })}{' '}
            {summary.changedStudents === 0
              ? null
              : t('range', {
                  rise: format.number(summary.largestRise),
                  fall: format.number(summary.largestFall),
                })}
          </p>
        )}
        {summary.incompatible === 0 ? null : (
          <p>{t('incompatible', { count: summary.incompatible })}</p>
        )}
        <p className="text-muted-foreground">{t('overrides')}</p>
        {summary.regradedAttempts === 0 ? null : confirming ? (
          <div
            role="group"
            aria-label={t('confirmLabel')}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="font-medium">
              {t('confirm', { count: summary.regradedAttempts })}
            </span>
            <Button
              type="button"
              size="sm"
              disabled={regrade.isPending}
              onClick={() => {
                regrade.mutate({ path });
              }}
            >
              {regrade.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : null}
              {t('apply')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setConfirming(false);
              }}
            >
              {t('cancel')}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="self-start"
            onClick={() => {
              setConfirming(true);
            }}
          >
            {t('start')}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
