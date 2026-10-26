'use client';

import { useTranslations } from 'next-intl';

import type { StudyProgress } from '@/entities/course-result';
import { institutionRoutes } from '@/shared/config';
import { Badge } from '@/shared/ui';

import { GlanceStat } from './glance-stat';

export function GlanceAverageStat({
  institutionId,
  progress,
}: {
  institutionId: string;
  progress: StudyProgress | undefined;
}) {
  const t = useTranslations('dashboard.glance');

  return (
    <GlanceStat
      href={institutionRoutes(institutionId).grades}
      label={t('average')}
      value={
        progress === undefined
          ? t('unavailable')
          : progress.weightedAverage === null
            ? t('noAverage')
            : progress.weightedAverage.toFixed(2)
      }
      detail={
        progress === undefined
          ? undefined
          : t('earned', { credits: progress.creditsEarned })
      }
      note={
        progress === undefined || progress.awaitingRetake === 0 ? undefined : (
          <Badge variant="warning" className="mt-1">
            {t('retake', { count: progress.awaitingRetake })}
          </Badge>
        )
      }
    />
  );
}
