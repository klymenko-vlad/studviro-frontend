'use client';

import { useFormatter, useTimeZone, useTranslations } from 'next-intl';

import { Button } from '@/shared/ui';

import type { Quiz } from '../model/quiz';

export function QuizSummary({
  quiz,
  audience,
}: {
  quiz: Quiz;
  audience: 'author' | 'student';
}) {
  const t = useTranslations('quiz');
  const format = useFormatter();
  const timeZone = useTimeZone() ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { settings } = quiz;
  if (settings === null) return null;

  const when = (iso: string) =>
    format.dateTime(new Date(iso), {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    });

  const facts = [
    settings.timeLimitMinutes === null
      ? t('noTimeLimit')
      : t('timeLimit', { minutes: settings.timeLimitMinutes }),
    settings.maxAttempts === null
      ? t('attemptsUnlimited')
      : t('attempts', { count: settings.maxAttempts }),
    t(`grading.${settings.gradingMethod}`),
    t('questionCount', { count: settings.questionCount }),
  ];
  const window = [
    quiz.opensAt === null ? null : t('opens', { when: when(quiz.opensAt) }),
    quiz.closesAt === null ? null : t('closes', { when: when(quiz.closesAt) }),
  ].filter(part => part !== null);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-sm">{facts.join(' · ')}</p>
      {window.length === 0 ? null : (
        <p className="text-muted-foreground text-sm">{window.join(' · ')}</p>
      )}
      {audience === 'student' ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" size="sm" disabled>
            {t('start')}
          </Button>
          <p className="text-muted-foreground text-sm" role="status">
            {settings.attempts === 'upcoming' && quiz.opensAt !== null
              ? t('state.upcoming', { when: when(quiz.opensAt) })
              : settings.attempts === 'closed'
                ? t('state.closed')
                : t('state.open')}
          </p>
        </div>
      ) : null}
    </div>
  );
}
