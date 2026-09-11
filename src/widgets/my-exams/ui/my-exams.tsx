'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import {
  ALL_COURSES,
  ChoiceFilter,
  CourseFilter,
  courseFilterOptions,
  offeringFilterValue,
  ScheduleFilters,
  ToggleFilter,
} from '@/features/filter-schedule';
import {
  actionableExamTerms,
  examTermQueries,
  splitExamTerms,
  type ExamTermKind,
} from '@/entities/exam-term';
import { Alert, AlertDescription, AlertTitle, Skeleton } from '@/shared/ui';

import { ExamTermSection } from './exam-term-section';

const ALL_KINDS = 'all';
const KINDS: ExamTermKind[] = ['regular', 'first_retake', 'second_retake', 'state_exam'];

export function MyExams({
  institutionId,
  now = new Date(),
}: {
  institutionId: string;
  now?: Date;
}) {
  const t = useTranslations('exams');
  const [offering, setOffering] = useState<string>(ALL_COURSES);
  const [kind, setKind] = useState<string>(ALL_KINDS);
  const [actionableOnly, setActionableOnly] = useState(false);

  const { data, isPending, isError } = useQuery(
    examTermQueries.list({
      path: { institutionId },
      query: {
        offeringId: offeringFilterValue(offering),
        kind: kind === ALL_KINDS ? undefined : (kind as ExamTermKind),
      },
    }),
  );

  const courses = useQuery({
    ...examTermQueries.list({ path: { institutionId } }),
    select: courseFilterOptions,
  });

  const filters = (
    <ScheduleFilters label={t('filters')}>
      <CourseFilter
        label={t('filterCourse')}
        allLabel={t('allCourses')}
        options={courses.data ?? []}
        value={offering}
        onChange={setOffering}
      />
      <ChoiceFilter
        label={t('filterKind')}
        allLabel={t('allKinds')}
        allValue={ALL_KINDS}
        options={KINDS.map(value => ({ value, label: t(`kind.${value}`) }))}
        value={kind}
        onChange={setKind}
      />
      <ToggleFilter
        label={t('actionableOnly')}
        checked={actionableOnly}
        onChange={setActionableOnly}
      />
    </ScheduleFilters>
  );

  if (isError)
    return (
      <div className="flex flex-col gap-8">
        {filters}
        <Alert variant="destructive">
          <AlertTitle>{t('errorTitle')}</AlertTitle>
          <AlertDescription>{t('errorDescription')}</AlertDescription>
        </Alert>
      </div>
    );

  if (isPending)
    return (
      <div className="flex flex-col gap-8">
        {filters}
        <Skeleton className="h-64 w-full" data-testid="my-exams-loading" />
      </div>
    );

  const visible = actionableOnly ? actionableExamTerms(data) : data;
  const { upcoming, past } = splitExamTerms(visible, now);

  return (
    <div className="flex flex-col gap-8" data-testid="my-exams">
      {filters}

      {visible.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {data.length === 0 ? t('empty') : t('emptyForFilters')}
        </p>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
