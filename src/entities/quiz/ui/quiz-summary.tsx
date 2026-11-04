'use client';

import { useTranslations } from 'next-intl';

import type { Quiz } from '../model/quiz';
import { useWhen } from '../model/use-when';

export function QuizSummary({ quiz }: { quiz: Quiz }) {
  const t = useTranslations('quiz');
  const when = useWhen();
  const { settings } = quiz;
  if (settings === null) return null;

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
    </div>
  );
}
