import type {
  AudienceDto,
  RestrictionDto,
  RestrictionViewDto,
  StudentSightDto,
} from '@/shared/api';
import { fromLocalInput, toLocalInput } from '@/shared/lib';

export type RestrictionView = RestrictionViewDto;
export type ConditionView = RestrictionViewDto['conditions'][number];
export type RestrictionMatch = RestrictionViewDto['match'];
export type RestrictionPayload = RestrictionDto;
export type AudienceView = NonNullable<RestrictionViewDto['audience']>;
export type AudiencePayload = AudienceDto;
export type StudentSight = StudentSightDto;

export function hasConditions(view: RestrictionView | null): view is RestrictionView {
  return view !== null && view.conditions.length > 0;
}

export const LEAF_CONDITION_TYPES = ['completed', 'mark', 'date', 'group'] as const;
export type ConditionType = (typeof LEAF_CONDITION_TYPES)[number] | 'set';

export interface ConditionDraft {
  id: number;
  type: ConditionType;
  item: string;
  atLeast: string;
  from: string;
  groupId: string;
  match: RestrictionMatch;
  conditions: ConditionDraft[];
}

export interface RestrictionDraft {
  match: RestrictionMatch;
  hideWhenLocked: boolean;
  conditions: ConditionDraft[];
}

type LeafPayload = NonNullable<
  RestrictionDto['conditions'][number]['conditions']
>[number];
type ConditionPayload = RestrictionDto['conditions'][number];

let nextId = 0;

export function blankCondition(type: ConditionType = 'completed'): ConditionDraft {
  nextId += 1;

  return {
    id: nextId,
    type,
    item: '',
    atLeast: '',
    from: '',
    groupId: '',
    match: 'all',
    conditions: type === 'set' ? [blankCondition()] : [],
  };
}

export function draftOf(
  view: RestrictionView | null,
  timeZone: string,
): RestrictionDraft {
  if (!hasConditions(view)) {
    return { match: 'all', hideWhenLocked: false, conditions: [blankCondition()] };
  }

  return {
    match: view.match,
    hideWhenLocked: view.hideWhenLocked,
    conditions: view.conditions.map(condition => conditionDraftOf(condition, timeZone)),
  };
}

function conditionDraftOf(
  condition: ConditionView | NonNullable<ConditionView['conditions']>[number],
  timeZone: string,
): ConditionDraft {
  return {
    ...blankCondition(condition.type),
    item:
      condition.itemKind !== null && condition.itemId !== null
        ? `${condition.itemKind}:${condition.itemId}`
        : '',
    atLeast: condition.atLeast === null ? '' : String(condition.atLeast),
    from: toLocalInput(condition.from, timeZone),
    groupId: condition.groupId ?? '',
    match: 'match' in condition && condition.match !== null ? condition.match : 'all',
    conditions:
      'conditions' in condition && condition.conditions !== null
        ? condition.conditions.map(leaf => conditionDraftOf(leaf, timeZone))
        : [],
  };
}

export function payloadOf(draft: RestrictionDraft, timeZone: string): RestrictionPayload {
  return {
    match: draft.match,
    hideWhenLocked: draft.hideWhenLocked,
    conditions: draft.conditions.map((condition): ConditionPayload => {
      if (condition.type !== 'set') return leafPayloadOf(condition, timeZone);

      return {
        type: 'set',
        match: condition.match,
        conditions: condition.conditions.map(leaf => leafPayloadOf(leaf, timeZone)),
      };
    }),
  };
}

function leafPayloadOf(draft: ConditionDraft, timeZone: string): LeafPayload {
  const [itemKind, itemId = ''] = draft.item.split(':');

  switch (draft.type) {
    case 'completed':
      return {
        type: 'completed',
        itemKind: itemKind === 'material' ? 'material' : 'assignment',
        itemId,
      };
    case 'mark':
      return { type: 'mark', itemId, atLeast: Number(draft.atLeast) };
    case 'date':
      return { type: 'date', from: fromLocalInput(draft.from, timeZone) };
    default:
      return { type: 'group', groupId: draft.groupId };
  }
}

export function draftIsComplete(draft: RestrictionDraft): boolean {
  return draft.conditions.length > 0 && draft.conditions.every(isComplete);
}

function isComplete(condition: ConditionDraft): boolean {
  switch (condition.type) {
    case 'completed':
      return condition.item !== '';
    case 'mark': {
      const points = Number(condition.atLeast);

      return (
        condition.item.startsWith('assignment:') &&
        condition.atLeast.trim() !== '' &&
        Number.isFinite(points) &&
        points >= 0
      );
    }
    case 'date':
      return condition.from !== '';
    case 'group':
      return condition.groupId !== '';
    case 'set':
      return condition.conditions.length > 0 && condition.conditions.every(isComplete);
  }
}
