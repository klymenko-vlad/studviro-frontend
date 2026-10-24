'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { QuizStart } from '@/features/start-quiz';
import { AvailabilityNote } from '@/entities/availability';
import { quizEditorHref, QuizSummary, type Quiz } from '@/entities/quiz';
import { Link } from '@/shared/config';
import { Badge } from '@/shared/ui';

export function OutlineQuiz({
  institutionId,
  offeringId,
  spaceId,
  quiz,
  manageable,
  actions,
  readOnly = false,
}: {
  institutionId: string;
  offeringId: string;
  spaceId: string;
  quiz: Quiz;
  manageable: boolean;
  actions: ReactNode;
  readOnly?: boolean;
}) {
  const t = useTranslations('quiz');
  const tOutline = useTranslations('outline');

  if (!manageable && quiz.settings === null) {
    return (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{quiz.name}</span>
          <Badge variant="secondary">{t('badge')}</Badge>
        </div>
        <AvailabilityNote item={quiz} audience="student" />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {manageable && !readOnly ? (
          <Link
            href={quizEditorHref(institutionId, offeringId, spaceId, quiz.id)}
            className="font-medium underline-offset-4 hover:underline"
          >
            {quiz.name}
          </Link>
        ) : (
          <span className="font-medium">{quiz.name}</span>
        )}
        <Badge variant="secondary">{t('badge')}</Badge>
        {quiz.visible ? null : <Badge variant="outline">{tOutline('hidden')}</Badge>}
        {manageable ? <AvailabilityNote item={quiz} audience="author" /> : null}
        {actions}
      </div>
      {quiz.brief === null ? null : (
        <p className="text-muted-foreground text-sm">{quiz.brief}</p>
      )}
      <QuizSummary quiz={quiz} />
      {manageable || readOnly ? null : (
        <QuizStart
          institutionId={institutionId}
          offeringId={offeringId}
          spaceId={spaceId}
          quiz={quiz}
        />
      )}
      {manageable ? null : <AvailabilityNote item={quiz} audience="student" />}
    </>
  );
}
