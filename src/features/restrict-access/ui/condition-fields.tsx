'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';

import {
  blankCondition,
  LEAF_CONDITION_TYPES,
  type ConditionDraft,
  type ConditionType,
} from '@/entities/restriction';
import { Button, Input, Label, Select, SelectItem } from '@/shared/ui';

export interface RestrictionCandidate {
  kind: 'material' | 'assignment' | 'quiz';
  id: string;
  title: string;
  tracked: boolean;
}

export interface GroupOption {
  id: string;
  name: string;
}

const NARROW = 'max-w-[75vw] sm:max-w-sm';

export function ConditionFields({
  condition,
  candidates,
  groups,
  nested,
  onChange,
  onRemove,
}: {
  condition: ConditionDraft;
  candidates: readonly RestrictionCandidate[];
  groups: readonly GroupOption[];
  nested: boolean;
  onChange: (next: ConditionDraft) => void;
  onRemove: () => void;
}) {
  const t = useTranslations('restriction');
  const id = useId();
  const set = (changes: Partial<ConditionDraft>) => {
    onChange({ ...condition, ...changes });
  };
  const types: readonly ConditionType[] = nested
    ? LEAF_CONDITION_TYPES
    : [...LEAF_CONDITION_TYPES, 'set'];
  const items =
    condition.type === 'mark'
      ? candidates.filter(candidate => candidate.kind !== 'material')
      : candidates.filter(candidate => candidate.tracked);

  const field = (suffix: string, label: string, control: React.ReactNode) => (
    <div className="flex flex-col gap-1">
      <Label htmlFor={`${id}-${suffix}`}>{label}</Label>
      {control}
    </div>
  );

  return (
    <li className="border-border flex flex-col gap-3 rounded-md border p-3">
      <div className="flex flex-wrap items-end gap-3">
        {field(
          'type',
          t('conditionType'),
          <Select
            id={`${id}-type`}
            className={NARROW}
            value={condition.type}
            onValueChange={value => {
              const type = value as ConditionType;
              onChange({ ...blankCondition(type), id: condition.id });
            }}
          >
            {types.map(type => (
              <SelectItem key={type} value={type}>
                {t(`type.${type}`)}
              </SelectItem>
            ))}
          </Select>,
        )}

        {condition.type === 'completed' || condition.type === 'mark'
          ? field(
              'item',
              condition.type === 'mark' ? t('markedItem') : t('item'),
              <Select
                id={`${id}-item`}
                className={NARROW}
                value={condition.item}
                onValueChange={item => {
                  set({ item });
                }}
              >
                <SelectItem value="">{t('choose')}</SelectItem>
                {items.map(item => (
                  <SelectItem key={item.id} value={`${item.kind}:${item.id}`}>
                    {item.title}
                  </SelectItem>
                ))}
              </Select>,
            )
          : null}

        {condition.type === 'mark'
          ? field(
              'points',
              t('atLeast'),
              <Input
                id={`${id}-points`}
                className="w-28"
                type="number"
                inputMode="decimal"
                min={0}
                value={condition.atLeast}
                onChange={event => {
                  set({ atLeast: event.target.value });
                }}
              />,
            )
          : null}

        {condition.type === 'date'
          ? field(
              'from',
              t('from'),
              <Input
                id={`${id}-from`}
                className="w-fit"
                type="datetime-local"
                value={condition.from}
                onChange={event => {
                  set({ from: event.target.value });
                }}
              />,
            )
          : null}

        {condition.type === 'group' ? (
          groups.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('noGroups')}</p>
          ) : (
            field(
              'group',
              t('studyGroup'),
              <Select
                id={`${id}-group`}
                className={NARROW}
                value={condition.groupId}
                onValueChange={groupId => {
                  set({ groupId });
                }}
              >
                <SelectItem value="">{t('choose')}</SelectItem>
                {groups.map(group => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </Select>,
            )
          )
        ) : null}

        {condition.type === 'set'
          ? field(
              'match',
              t('setMatch'),
              <Select
                id={`${id}-match`}
                value={condition.match}
                onValueChange={match => {
                  set({ match: match as ConditionDraft['match'] });
                }}
              >
                <SelectItem value="all">{t('matchAll')}</SelectItem>
                <SelectItem value="any">{t('matchAny')}</SelectItem>
              </Select>,
            )
          : null}

        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          {t('removeCondition')}
        </Button>
      </div>

      {condition.type === 'set' ? (
        <>
          <ul className="flex flex-col gap-3">
            {condition.conditions.map((leaf, index) => (
              <ConditionFields
                key={leaf.id}
                condition={leaf}
                candidates={candidates}
                groups={groups}
                nested
                onChange={next => {
                  set({ conditions: condition.conditions.with(index, next) });
                }}
                onRemove={() => {
                  set({
                    conditions: condition.conditions.filter((_, at) => at !== index),
                  });
                }}
              />
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => {
              set({ conditions: [...condition.conditions, blankCondition()] });
            }}
          >
            {t('addToSet')}
          </Button>
        </>
      ) : null}
    </li>
  );
}
