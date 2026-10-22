import type { NavKey, VisibleNavGroup } from './nav-groups';

const TAB_COUNT = 4;

/**
 * The screens a person returns to most, in the order they earn a place: home,
 * then the work their role is about, then time and news. The rest stay one tap
 * away behind _More_.
 */
const PRIORITY: NavKey[] = [
  'dashboard',
  'courses',
  'teaching',
  'catalogue',
  'people',
  'calendar',
  'notifications',
  'grades',
  'exams',
];

export function bottomTabs(groups: VisibleNavGroup[]): NavKey[] {
  const visible = new Set(groups.flatMap(group => group.items));
  const chosen = PRIORITY.filter(key => visible.has(key)).slice(0, TAB_COUNT - 1);
  const news = visible.has('notifications') && !chosen.includes('notifications');

  if (news) return [...chosen, 'notifications'];
  return PRIORITY.filter(key => visible.has(key)).slice(0, TAB_COUNT);
}
