import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '@/shared/test';

import type { ConditionView, RestrictionView } from '../model/restriction';
import { RestrictionNote } from './restriction-note';

const leaf = (overrides: Partial<ConditionView>): ConditionView => ({
  type: 'completed',
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

const restriction = (overrides: Partial<RestrictionView>): RestrictionView => ({
  match: 'all',
  hideWhenLocked: false,
  locked: true,
  conditions: [],
  audience: null,
  ...overrides,
});

const groups = (hideFromOthers: boolean, ...names: (string | null)[]) => ({
  hideFromOthers,
  groups: names.map((groupName, index) => ({
    groupId: `f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f${String(index)}`,
    groupName,
    missing: groupName === null,
  })),
});

const items = () => screen.getAllByRole('listitem').map(item => item.textContent);

describe('RestrictionNote', () => {
  it('says what each kind of condition needs, and when one has been removed', () => {
    renderWithProviders(
      <RestrictionNote
        audience="student"
        restriction={restriction({
          conditions: [
            leaf({ type: 'completed', itemTitle: 'Week 1 quiz' }),
            leaf({ type: 'mark', itemTitle: 'Assignment 1', atLeast: 50 }),
            leaf({ type: 'date', from: '2026-11-03T08:00:00.000Z' }),
            leaf({ type: 'group', groupName: 'S1' }),
            leaf({ type: 'completed', missing: true }),
            leaf({ type: 'group', missing: true }),
          ],
        })}
      />,
    );

    expect(screen.getByText('Locked')).toBeInTheDocument();
    expect(screen.getByText('All of these:')).toBeInTheDocument();
    expect(items()).toEqual([
      'Complete Week 1 quiz first',
      'Get at least 50 in Assignment 1',
      'Available from November 3 at 10:00',
      'Only for group S1',
      'Complete an item that has been removed',
      'Only for a group that has been removed',
    ]);
  });

  it('reads a group of one condition as that condition, and a larger group as its own list', () => {
    renderWithProviders(
      <RestrictionNote
        audience="student"
        restriction={restriction({
          match: 'any',
          conditions: [
            leaf({
              type: 'set',
              match: 'all',
              conditions: [leaf({ type: 'group', groupName: 'S1' })],
            }),
            leaf({
              type: 'set',
              match: 'any',
              conditions: [
                leaf({ type: 'group', groupName: 'S2' }),
                leaf({ type: 'group', groupName: 'S3' }),
              ],
            }),
          ],
        })}
      />,
    );

    expect(screen.getAllByText('Any one of these:')).toHaveLength(2);
    expect(items()[0]).toBe('Only for group S1');
    expect(items()).toContain('Only for group S2');
  });

  it('says nothing to a student who is not locked out, and badges it for an author', () => {
    const { unmount } = renderWithProviders(
      <RestrictionNote audience="student" restriction={restriction({ locked: false })} />,
    );
    expect(screen.queryByRole('note')).toBeNull();
    unmount();

    renderWithProviders(
      <RestrictionNote
        audience="author"
        restriction={restriction({
          locked: false,
          hideWhenLocked: true,
          conditions: [leaf({ type: 'completed', itemTitle: 'Week 1 quiz' })],
        })}
      />,
    );
    expect(screen.getByText('Restricted · hidden while locked')).toBeInTheDocument();
  });

  it('badges the groups it is for, and how others see it, for an author', () => {
    const { unmount } = renderWithProviders(
      <RestrictionNote
        audience="author"
        restriction={restriction({ locked: false, audience: groups(true, 'S1', 'S2') })}
      />,
    );
    expect(screen.getByText('Group S1, S2')).toBeInTheDocument();
    expect(screen.getByText('Hidden from other groups')).toBeInTheDocument();
    expect(screen.queryByText('Restricted')).toBeNull();
    unmount();

    renderWithProviders(
      <RestrictionNote
        audience="author"
        restriction={restriction({
          locked: false,
          audience: groups(false, 'S2', null),
          conditions: [leaf({ type: 'completed', itemTitle: 'Week 1 quiz' })],
        })}
      />,
    );
    expect(screen.getByText('Group S2, a removed group')).toBeInTheDocument();
    expect(screen.getByText('Other groups see it locked')).toBeInTheDocument();
    expect(screen.getByText('Restricted')).toBeInTheDocument();
  });

  it('tells a student outside the groups who it is for', () => {
    renderWithProviders(
      <RestrictionNote
        audience="student"
        restriction={restriction({ audience: groups(false, 'S2') })}
      />,
    );

    expect(screen.getByText('Locked')).toBeInTheDocument();
    expect(screen.getByText('Only for group S2')).toBeInTheDocument();
    expect(screen.queryByText('All of these:')).toBeNull();
  });

  it('renders nothing without a restriction', () => {
    renderWithProviders(<RestrictionNote audience="author" restriction={null} />);

    expect(screen.queryByRole('note')).toBeNull();
  });
});
