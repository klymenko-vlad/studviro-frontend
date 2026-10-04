'use client';

import { useTranslations } from 'next-intl';

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui';

import { CalendarTile } from './calendar-tile';
import { CoursesTile } from './courses-tile';
import { DeadlinesTile } from './deadlines-tile';
import { GradesTile } from './grades-tile';

export function StudiesSection({
  institutionId,
  canReadCourses,
  canReadGrades,
  canReadSchedule,
  showWeek = true,
}: {
  institutionId: string;
  canReadCourses: boolean;
  canReadGrades: boolean;
  canReadSchedule: boolean;
  showWeek?: boolean;
}) {
  const t = useTranslations('dashboard');

  if (!canReadCourses && !canReadGrades && !canReadSchedule) {
    return (
      <Alert>
        <AlertTitle>{t('deniedTitle')}</AlertTitle>
        <AlertDescription>{t('deniedDescription')}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {canReadCourses ? <CoursesTile institutionId={institutionId} /> : null}
      {canReadGrades ? <GradesTile institutionId={institutionId} /> : null}
      {canReadSchedule && showWeek ? (
        <CalendarTile institutionId={institutionId} />
      ) : null}
      {canReadSchedule ? <DeadlinesTile institutionId={institutionId} /> : null}
    </div>
  );
}
