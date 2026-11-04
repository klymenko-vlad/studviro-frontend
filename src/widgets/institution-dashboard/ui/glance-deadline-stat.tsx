'use client';

import { useTranslations } from 'next-intl';

import { nextDeadlines, type Deadline } from '@/entities/deadline';
import { institutionRoutes } from '@/shared/config';

import { useRelativeDue } from '../model/use-relative-due';
import { GlanceStat } from './glance-stat';

export function GlanceDeadlineStat({
  institutionId,
  deadlines,
  now,
}: {
  institutionId: string;
  deadlines: Deadline[] | undefined;
  now: Date;
}) {
  const t = useTranslations('dashboard.glance');
  const due = useRelativeDue(now);
  const next =
    deadlines === undefined
      ? undefined
      : nextDeadlines(
          deadlines.filter(deadline => new Date(deadline.dueAt) > now),
          1,
        )[0];

  return (
    <GlanceStat
      href={institutionRoutes(institutionId).calendar}
      label={t('deadline')}
      value={
        deadlines === undefined
          ? t('unavailable')
          : next === undefined
            ? t('nothingDue')
            : due(next.dueAt)
      }
      detail={
        deadlines === undefined
          ? undefined
          : next === undefined
            ? t('nothingDueDetail')
            : `${next.name} · ${next.course.code}`
      }
    />
  );
}
