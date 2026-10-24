'use client';

import { useEffect, useRef } from 'react';
import { CircleCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useWhen, type QuizAttempt } from '@/entities/quiz';
import { Link } from '@/shared/config';
import { Button, Card, CardContent } from '@/shared/ui';

export function AttemptEnd({
  attempt,
  backHref,
}: {
  attempt: QuizAttempt;
  backHref: string;
}) {
  const t = useTranslations('quiz.take.end');
  const when = useWhen();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <CircleCheck aria-hidden className="text-primary size-5" />
          <h2 ref={heading} tabIndex={-1} className="text-lg font-semibold outline-none">
            {t('title', { number: attempt.attempt })}
          </h2>
        </div>
        {attempt.finishedAt === null || attempt.closedBy === null ? null : (
          <p>{t(attempt.closedBy, { when: when(attempt.finishedAt) })}</p>
        )}
        <Button asChild variant="outline" className="self-start">
          <Link href={backHref}>{t('back')}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
