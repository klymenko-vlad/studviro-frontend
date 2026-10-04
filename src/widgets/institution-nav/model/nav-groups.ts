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
  | 'notifications'
  | 'search'
  | 'courses'
  | 'enroll'
  | 'grades'
  | 'exams'
  | 'teaching'
  | 'catalogue'
  | 'bulk'
  | 'learning'
  | 'people'
  | 'orgUnits'
  | 'roles'
  | 'audit'
  | 'settings';

type NavGroupKey = 'general' | 'studies' | 'teaching' | 'administration';

interface NavItem {
  key: NavKey;
  /** The permission the screen's endpoint refuses without. `null`: none. */
  gate: Permission | null;
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
  {
    key: 'general',
    for: EVERYONE,
    items: [
      { key: 'dashboard', gate: null },
      { key: 'calendar', gate: 'schedule:read', feature: 'timetable' },
      { key: 'notifications', gate: 'notification:read' },
      { key: 'search', gate: 'institution:read' },
    ],
  },
  {
    key: 'studies',
    for: studies,
    items: [
      { key: 'courses', gate: 'enrollment:read' },
      { key: 'enroll', gate: 'course:enroll', feature: 'courseRegistration' },
      { key: 'grades', gate: 'grade:read', feature: 'grades' },
      { key: 'exams', gate: 'schedule:read', feature: 'examRegistration' },
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
    items: [
      { key: 'catalogue', gate: 'course:manage' },
      { key: 'bulk', gate: 'offering:manage' },
      { key: 'learning', gate: 'offering:manage' },
      { key: 'people', gate: 'role:read' },
      { key: 'orgUnits', gate: 'role:read' },
      { key: 'roles', gate: 'role:assign' },
      { key: 'audit', gate: 'audit:read' },
      { key: 'settings', gate: 'institution:manage' },
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
        .filter(item => item.gate === null || can(item.gate))
        .filter(item => item.feature === undefined || isEnabled(item.feature))
        .map(item => item.key),
    }))
    .filter(group => group.items.length > 0);
}
