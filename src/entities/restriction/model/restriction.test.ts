import { describe, expect, it } from 'vitest';

import {
  blankCondition,
  draftIsComplete,
  draftOf,
  payloadOf,
  type RestrictionDraft,
  type RestrictionView,
} from './restriction';

const TZ = 'Europe/Bratislava';
const QUIZ = '6a1f0c1e-0000-4000-8000-0000000000aa';
const NOTES = '6a1f0c1e-0000-4000-8000-0000000000bb';
const GROUP = '6a1f0c1e-0000-4000-8000-0000000000cc';

const leaf = (overrides: Partial<RestrictionView['conditions'][number]>) => ({
  type: 'completed' as const,
  itemKind: null,
  itemId: null,
  itemTitle: null,
  atLeast: null,
  from: null,
  groupId: null,
  groupName: null,
  missing: false,
  match: null,
  conditions: null,
  ...overrides,
});

const view: RestrictionView = {
  match: 'any',
  hideWhenLocked: true,
  locked: false,
  audience: null,
  conditions: [
    leaf({ type: 'completed', itemKind: 'material', itemId: NOTES, itemTitle: 'Notes' }),
    leaf({ type: 'date', from: '2026-11-03T08:00:00.000Z' }),
    leaf({
      type: 'set',
      match: 'all',
      conditions: [
        leaf({ type: 'mark', itemKind: 'assignment', itemId: QUIZ, atLeast: 50 }),
        leaf({ type: 'group', groupId: GROUP, groupName: 'S1' }),
      ],
    }),
  ],
};

describe('a restriction as the editor holds it', () => {
  it('starts with one empty condition when there is no restriction', () => {
    const draft = draftOf(null, TZ);

    expect(draft).toMatchObject({ match: 'all', hideWhenLocked: false });
    expect(draft.conditions).toHaveLength(1);
    expect(draftIsComplete(draft)).toBe(false);
  });

  it('round-trips every kind of condition and a group of them', () => {
    const draft = draftOf(view, TZ);

    expect(draft.conditions.map(condition => condition.type)).toEqual([
      'completed',
      'date',
      'set',
    ]);
    expect(draft.conditions[1]?.from).toBe('2026-11-03T09:00');
    expect(draftIsComplete(draft)).toBe(true);
    expect(payloadOf(draft, TZ)).toEqual({
      match: 'any',
      hideWhenLocked: true,
      conditions: [
        { type: 'completed', itemKind: 'material', itemId: NOTES },
        { type: 'date', from: '2026-11-03T08:00:00.000Z' },
        {
          type: 'set',
          match: 'all',
          conditions: [
            { type: 'mark', itemId: QUIZ, atLeast: 50 },
            { type: 'group', groupId: GROUP },
          ],
        },
      ],
    });
  });

  it.each([
    ['an item', { type: 'completed' as const }],
    ['a threshold', { type: 'mark' as const, item: `assignment:${QUIZ}` }],
    ['an assignment for a mark', { type: 'mark' as const, atLeast: '5' }],
    [
      'a negative threshold',
      { type: 'mark' as const, item: `assignment:${QUIZ}`, atLeast: '-1' },
    ],
    ['a date', { type: 'date' as const }],
    ['a group', { type: 'group' as const }],
    ['anything in a group of conditions', { type: 'set' as const, conditions: [] }],
  ])('is incomplete without %s', (_, overrides) => {
    const draft: RestrictionDraft = {
      match: 'all',
      hideWhenLocked: false,
      conditions: [{ ...blankCondition(), ...overrides }],
    };

    expect(draftIsComplete(draft)).toBe(false);
  });

  it('is incomplete with no conditions at all', () => {
    expect(draftIsComplete({ match: 'all', hideWhenLocked: false, conditions: [] })).toBe(
      false,
    );
  });

  it('gives each new condition its own key', () => {
    expect(blankCondition().id).not.toBe(blankCondition().id);
  });
});
