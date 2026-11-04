'use client';

import { useTranslations } from 'next-intl';

import { Progress } from '@/shared/ui';

import type { Tally } from '../model/completion';

export function ProgressMeter({ tally, label }: { tally: Tally; label: string }) {
  const t = useTranslations('completion');
  const summary = t('progress', { done: tally.done, total: tally.total });
  const percent = tally.total === 0 ? 0 : Math.round((tally.done / tally.total) * 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{summary}</span>
      </div>
      <Progress value={percent} aria-label={label} getValueLabel={() => summary} />
    </div>
  );
}
