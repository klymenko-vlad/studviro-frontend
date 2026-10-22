import type { NavKey, VisibleNavGroup } from './nav-groups';

/** As many as a thumb can tell apart; past this, the last slot becomes _More_. */
export const TAB_LIMIT = 5;

/**
 * The screens a person returns to most, in the order they earn a place: home,
 * then the work their role is about, then time.
 */
const PRIORITY: NavKey[] = [
  'dashboard',
  'courses',
  'teaching',
  'calendar',
  'exams',
  'grades',
  'catalogue',
  'people',
];

/**
 * The phone's tabs. A person with five screens or fewer gets all of them and
 * no _More_; anyone with more gets the four that matter most to them, and
 * `more: true`.
 */
export function bottomTabs(groups: VisibleNavGroup[]): { tabs: NavKey[]; more: boolean } {
  const all = groups.flatMap(group => group.items);
  if (all.length <= TAB_LIMIT) return { tabs: all, more: false };

  const visible = new Set(all);
  const ranked = [
    ...PRIORITY.filter(key => visible.has(key)),
    ...all.filter(key => !PRIORITY.includes(key)),
  ];
  return { tabs: ranked.slice(0, TAB_LIMIT - 1), more: true };
}
