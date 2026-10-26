'use client';

import { useTranslations } from 'next-intl';

import {
  groupByTerm,
  totalCredits,
  type EnrolledCourse,
} from '@/entities/enrolled-course';
import { institutionRoutes } from '@/shared/config';

import { GlanceStat } from './glance-stat';

export function GlanceTermStat({
  institutionId,
  courses,
}: {
  institutionId: string;
  courses: EnrolledCourse[] | undefined;
}) {
  const t = useTranslations('dashboard.glance');
  const term = courses === undefined ? undefined : groupByTerm(courses)[0];

  return (
    <GlanceStat
      href={institutionRoutes(institutionId).courses}
      label={t('term')}
      value={
        courses === undefined
          ? t('unavailable')
          : term === undefined
            ? t('noCourses')
            : t('courses', { count: term.courses.length })
      }
      detail={
        term === undefined
          ? undefined
          : t('credits', { count: totalCredits(term.courses) })
      }
    />
  );
}
