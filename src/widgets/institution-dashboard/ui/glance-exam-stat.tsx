'use client';

import { useTranslations } from 'next-intl';

import type { ExamTerm } from '@/entities/exam-term';
import { institutionRoutes } from '@/shared/config';

import { nextExam } from '../model/next-exam';
import { useRelativeDue } from '../model/use-relative-due';
import { GlanceStat } from './glance-stat';

export function GlanceExamStat({
  institutionId,
  exams,
  now,
}: {
  institutionId: string;
  exams: ExamTerm[] | undefined;
  now: Date;
}) {
  const t = useTranslations('dashboard.glance');
  const due = useRelativeDue(now);
  const next = exams === undefined ? undefined : nextExam(exams, now);

  return (
    <GlanceStat
      href={institutionRoutes(institutionId).exams}
      label={t('exam')}
      value={
        next === undefined
          ? t('unavailable')
          : next.kind === 'registered'
            ? due(next.term.startsAt)
            : next.kind === 'open'
              ? t('examsOpen', { count: next.count })
              : t('noExam')
      }
      detail={
        next?.kind === 'registered'
          ? next.term.course.title
          : next?.kind === 'open'
            ? t('register')
            : undefined
      }
    />
  );
}
