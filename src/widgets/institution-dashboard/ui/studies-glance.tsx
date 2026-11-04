'use client';

import { useTranslations } from 'next-intl';

import { Skeleton } from '@/shared/ui';

import { useGlanceQueries } from '../model/use-glance-queries';
import { GlanceAverageStat } from './glance-average-stat';
import { GlanceDeadlineStat } from './glance-deadline-stat';
import { GlanceExamStat } from './glance-exam-stat';
import { GlanceTermStat } from './glance-term-stat';

export function StudiesGlance({
  institutionId,
  canReadCourses,
  canReadGrades,
  canReadSchedule,
  canReadExams,
  now,
}: {
  institutionId: string;
  canReadCourses: boolean;
  canReadGrades: boolean;
  canReadSchedule: boolean;
  canReadExams: boolean;
  now: Date;
}) {
  const t = useTranslations('dashboard.glance');
  const { courses, progress, deadlines, exams, isPending } = useGlanceQueries({
    institutionId,
    canReadCourses,
    canReadGrades,
    canReadSchedule,
    canReadExams,
    now,
  });

  const shown = [canReadCourses, canReadGrades, canReadSchedule, canReadExams].filter(
    Boolean,
  ).length;

  if (shown === 0) return null;

  return (
    <section aria-label={t('label')}>
      {isPending ? (
        <div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          data-testid="dashboard-glance-loading"
        >
          {Array.from({ length: shown }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {canReadCourses ? (
            <GlanceTermStat institutionId={institutionId} courses={courses.data} />
          ) : null}
          {canReadGrades ? (
            <GlanceAverageStat institutionId={institutionId} progress={progress.data} />
          ) : null}
          {canReadSchedule ? (
            <GlanceDeadlineStat
              institutionId={institutionId}
              deadlines={deadlines.data}
              now={now}
            />
          ) : null}
          {canReadExams ? (
            <GlanceExamStat institutionId={institutionId} exams={exams.data} now={now} />
          ) : null}
        </ul>
      )}
    </section>
  );
}
