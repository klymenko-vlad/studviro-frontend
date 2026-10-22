import { runsInstitution, type Role } from '@/entities/permission';

export type DashboardSection = 'administration' | 'teaching' | 'studies';

/**
 * Who a person is here decides what their dashboard is about. Permissions
 * cannot: every role holds the reads a student holds, so gating on them alone
 * gave an administrator a student's dashboard. A teaching assistant who is also
 * a student is a student first, so their studies lead.
 */
export function dashboardSections(roles: readonly Role[]): DashboardSection[] {
  const has = (role: Role) => roles.includes(role);
  const sections: DashboardSection[] = [];

  if (runsInstitution(roles)) sections.push('administration');
  if (has('teacher')) sections.push('teaching');
  if (has('student')) sections.push('studies');
  if (has('teaching_assistant') && !has('teacher')) sections.push('teaching');

  return sections;
}
