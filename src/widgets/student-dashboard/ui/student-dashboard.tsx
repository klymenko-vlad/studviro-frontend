'use client';

import { useTranslations } from 'next-intl';

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui';

import { CoursesTile } from './courses-tile';
import { GradesTile } from './grades-tile';

export function StudentDashboard({
  institutionId,
  canReadCourses,
  canReadGrades,
}: {
  institutionId: string;
  canReadCourses: boolean;
  canReadGrades: boolean;
}) {
  const t = useTranslations('dashboard');

  if (!canReadCourses && !canReadGrades) {
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
    </div>
  );
}
