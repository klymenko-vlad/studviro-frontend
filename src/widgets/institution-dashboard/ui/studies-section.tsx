'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui';

import { CalendarTile } from './calendar-tile';
import { CoursesTile } from './courses-tile';
import { DeadlinesTile } from './deadlines-tile';
import { GradesTile } from './grades-tile';
import { StudiesGlance } from './studies-glance';

export function StudiesSection({
  institutionId,
  canReadCourses,
  canReadGrades,
  canReadSchedule,
  canReadExams = false,
  showWeek = true,
  now: initialNow,
}: {
  institutionId: string;
  canReadCourses: boolean;
  canReadGrades: boolean;
  canReadSchedule: boolean;
  canReadExams?: boolean;
  showWeek?: boolean;
  now?: Date;
}) {
  const t = useTranslations('dashboard');
  const [now] = useState(() => initialNow ?? new Date());

  if (!canReadCourses && !canReadGrades && !canReadSchedule) {
    return (
      <Alert>
        <AlertTitle>{t('deniedTitle')}</AlertTitle>
        <AlertDescription>{t('deniedDescription')}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <StudiesGlance
        institutionId={institutionId}
        canReadCourses={canReadCourses}
        canReadGrades={canReadGrades}
        canReadSchedule={canReadSchedule}
        canReadExams={canReadExams}
        now={now}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {canReadSchedule ? (
          <DeadlinesTile institutionId={institutionId} now={now} />
        ) : null}
        {canReadSchedule && showWeek ? (
          <CalendarTile institutionId={institutionId} now={now} />
        ) : null}
        {canReadCourses ? <CoursesTile institutionId={institutionId} /> : null}
        {canReadGrades ? <GradesTile institutionId={institutionId} /> : null}
      </div>
    </div>
  );
}
