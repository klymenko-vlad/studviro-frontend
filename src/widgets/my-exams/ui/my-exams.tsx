'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { examTermQueries, splitExamTerms } from '@/entities/exam-term';
import { Alert, AlertDescription, AlertTitle, Skeleton } from '@/shared/ui';

import { ExamTermSection } from './exam-term-section';

export function MyExams({
  institutionId,
  now = new Date(),
}: {
  institutionId: string;
  now?: Date;
}) {
  const t = useTranslations('exams');
  const { data, isPending, isError } = useQuery(
    examTermQueries.list({ path: { institutionId } }),
  );

  if (isPending)
    return <Skeleton className="h-64 w-full" data-testid="my-exams-loading" />;

  if (isError)
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('errorTitle')}</AlertTitle>
        <AlertDescription>{t('errorDescription')}</AlertDescription>
      </Alert>
    );

  if (data.length === 0)
    return <p className="text-muted-foreground text-sm">{t('empty')}</p>;

  const { upcoming, past } = splitExamTerms(data, now);

  return (
    <div className="flex flex-col gap-8" data-testid="my-exams">
      <p className="text-muted-foreground text-sm">
        {t('summary', { terms: upcoming.length })}
      </p>

      {upcoming.length === 0 ? null : (
        <ExamTermSection
          heading={t('upcoming')}
          id="exams-upcoming"
          terms={upcoming}
          institutionId={institutionId}
        />
      )}

      {past.length === 0 ? null : (
        <ExamTermSection
          heading={t('past')}
          id="exams-past"
          terms={past}
          institutionId={institutionId}
        />
      )}
    </div>
  );
}
