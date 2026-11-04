import type { FeatureFlag } from '@/entities/institution-configuration';
import {
  runsInstitution,
  studies,
  teaches,
  type Permission,
  type Role,
} from '@/entities/permission';

export type NavKey =
  | 'dashboard'
  | 'calendar'
  | 'courses'
  | 'grades'
  | 'exams'
  | 'teaching'
  | 'structure'
  | 'offer'
  | 'people'
  | 'settings';

type NavGroupKey = 'general' | 'studies' | 'teaching' | 'administration';

interface NavItem {
  key: NavKey;
  /**
   * The permission the screen's endpoint refuses without. `null`: none. A list
   * is a hub of several screens, offered when any one of them would open.
   */
  gate: Permission | readonly Permission[] | null;
  /** A screen whose feature the institution turned off is not offered. */
  feature?: FeatureFlag;
}

interface NavGroup {
  key: NavGroupKey;
  /** Whether the group is about this person at all. */
  for: (roles: readonly Role[]) => boolean;
  items: NavItem[];
}

const EVERYONE = () => true;

/**
 * Grouped by who a screen is for, so a person sees the groups their roles
 * call for and nothing else. Inside a group, each screen is still gated on the
 * server's own permission answer, so the nav never offers a door that refuses.
 */
const GROUPS: NavGroup[] = [
  // Search and notifications are not places: they live in the header, beside
  // the account menu, on every screen. Finding a course is a tab of Courses.
  {
    key: 'general',
    for: EVERYONE,
    items: [
      { key: 'dashboard', gate: null },
      { key: 'calendar', gate: 'schedule:read', feature: 'timetable' },
    ],
  },
  {
    key: 'studies',
    for: studies,
    items: [
      { key: 'courses', gate: 'enrollment:read' },
      { key: 'exams', gate: 'schedule:read', feature: 'examRegistration' },
      { key: 'grades', gate: 'grade:read', feature: 'grades' },
    ],
  },
  {
    key: 'teaching',
    for: teaches,
    items: [{ key: 'teaching', gate: 'grade:propose' }],
  },
  {
    key: 'administration',
    for: runsInstitution,
    // Four hubs in the order an institution is set up: how it is built, what
    // it teaches, who is in it, and the institution's own settings and tools.
    items: [
      { key: 'structure', gate: 'role:read' },
      { key: 'offer', gate: ['course:manage', 'offering:manage'] },
      { key: 'people', gate: 'role:read' },
      {
        key: 'settings',
        gate: ['institution:manage', 'offering:manage', 'program:manage', 'audit:read'],
      },
    ],
  },
];

export interface VisibleNavGroup {
  key: NavGroupKey;
  items: NavKey[];
}

export function visibleNavGroups({
  roles,
  can,
  isEnabled,
}: {
  roles: readonly Role[];
  can: (permission: Permission) => boolean;
  isEnabled: (feature: FeatureFlag) => boolean;
}): VisibleNavGroup[] {
  return GROUPS.filter(group => group.for(roles))
    .map(group => ({
      key: group.key,
      items: group.items
        .filter(item => opens(item.gate, can))
        .filter(item => item.feature === undefined || isEnabled(item.feature))
        .map(item => item.key),
    }))
    .filter(group => group.items.length > 0);
}

function opens(gate: NavItem['gate'], can: (permission: Permission) => boolean): boolean {
  if (gate === null) return true;
  if (typeof gate === 'string') return can(gate);
  return gate.some(permission => can(permission));
}
