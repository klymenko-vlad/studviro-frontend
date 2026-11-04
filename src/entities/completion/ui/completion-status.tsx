'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/shared/ui';

import { isDone, type ItemProgress } from '../model/completion';

export function CompletionStatus({
  item,
  passPoints = null,
}: {
  item: ItemProgress;
  passPoints?: number | null;
}) {
  const t = useTranslations('completion');

  if (isDone(item.state)) {
    return (
      <Badge variant="success">
        <Check aria-hidden className="size-3" />
        {item.state === 'complete_pass' ? t('state.passed') : t('state.done')}
      </Badge>
    );
  }

  if (item.state === 'complete_fail') {
    return <Badge variant="warning">{t('state.failed')}</Badge>;
  }

  if (item.rule === 'none' || item.rule === 'manual') return null;

  return (
    <span className="text-muted-foreground text-sm">
      {t(`todo.${item.rule}`, { points: passPoints ?? 0 })}
    </span>
  );
}
