'use client';

import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { useFormatter, useTimeZone, useTranslations } from 'next-intl';

import { DEFAULT_TIME_ZONE } from '@/shared/config';
import { Badge } from '@/shared/ui';

import {
  hasConditions,
  type ConditionView,
  type RestrictionMatch,
  type RestrictionView,
} from '../model/restriction';
import { AudienceNote } from './audience-note';

type Leaf = NonNullable<ConditionView['conditions']>[number];

export function RestrictionNote({
  restriction,
  audience,
}: {
  restriction: RestrictionView | null;
  audience: 'author' | 'student';
}) {
  const t = useTranslations('restriction');
  if (restriction === null || (audience === 'student' && !restriction.locked))
    return null;

  return (
    <div className="text-muted-foreground flex flex-col gap-1 text-sm" role="note">
      {audience === 'student' ? (
        <p className="text-foreground flex items-center gap-1 font-medium">
          <Lock aria-hidden="true" className="size-4" />
          {t('locked')}
        </p>
      ) : null}
      {restriction.audience === null ? null : (
        <AudienceNote audience={restriction.audience} viewer={audience} />
      )}
      {audience === 'author' && hasConditions(restriction) ? (
        <Badge variant="outline" className="w-fit">
          <Lock aria-hidden="true" />
          {t(restriction.hideWhenLocked ? 'badgeHidden' : 'badge')}
        </Badge>
      ) : null}
      {hasConditions(restriction) ? (
        <Conditions match={restriction.match} conditions={restriction.conditions} />
      ) : null}
    </div>
  );
}

function Conditions({
  match,
  conditions,
}: {
  match: RestrictionMatch;
  conditions: readonly (ConditionView | Leaf)[];
}) {
  const t = useTranslations('restriction');
  const sentence = useSentence();

  return (
    <>
      {conditions.length > 1 ? <p>{t(match === 'all' ? 'allOf' : 'anyOf')}</p> : null}
      <ul className="list-disc ps-5">
        {conditions.map((condition, index) => (
          <li key={`${condition.type}-${String(index)}`}>
            {condition.type === 'set' &&
            'conditions' in condition &&
            (condition.conditions?.length ?? 0) > 1 ? (
              <Conditions
                match={condition.match ?? 'all'}
                conditions={condition.conditions ?? []}
              />
            ) : (
              sentence(
                'conditions' in condition && condition.conditions?.[0]
                  ? condition.conditions[0]
                  : condition,
              )
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

function useSentence(): (condition: Leaf) => ReactNode {
  const t = useTranslations('restriction');
  const format = useFormatter();
  const timeZone = useTimeZone() ?? DEFAULT_TIME_ZONE;
  const em = (chunks: ReactNode) => <em className="text-foreground">{chunks}</em>;

  return condition => {
    switch (condition.type) {
      case 'completed':
        return condition.missing
          ? t('completedMissing')
          : t.rich('completed', { title: condition.itemTitle ?? '', em });
      case 'mark':
        return condition.missing
          ? t('markMissing', { points: condition.atLeast ?? 0 })
          : t.rich('mark', {
              points: condition.atLeast ?? 0,
              title: condition.itemTitle ?? '',
              em,
            });
      case 'date':
        return t('date', {
          when: format.dateTime(new Date(condition.from ?? 0), {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone,
          }),
        });
      default:
        return condition.missing
          ? t('groupMissing')
          : t('group', { name: condition.groupName ?? '' });
    }
  };
}
