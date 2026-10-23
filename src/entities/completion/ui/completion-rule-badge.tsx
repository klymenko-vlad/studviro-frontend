'use client';

import { useTranslations } from 'next-intl';

import { Badge } from '@/shared/ui';

import type { CompletionRule } from '../model/completion';

export function CompletionRuleBadge({
  rule,
  passPoints = null,
}: {
  rule: CompletionRule;
  passPoints?: number | null;
}) {
  const t = useTranslations('completion');
  if (rule === 'none') return null;

  return (
    <Badge variant="outline">
      {rule === 'passed'
        ? t('ruleBadgePassed', { points: passPoints ?? 0 })
        : t(`ruleBadge.${rule}`)}
    </Badge>
  );
}
