import type { Role } from './use-permissions';

const ADMINISTRATION: readonly Role[] = [
  'institution_admin',
  'org_unit_manager',
  'program_coordinator',
  'course_coordinator',
  'registrar',
];

/**
 * Who a person is here, as opposed to what they may do. Every role holds the
 * reads a student holds, so permissions alone cannot tell an administrator's
 * screen from a student's; these decide what is relevant, never what is
 * allowed — the server's permission answer still gates every screen.
 */
export function runsInstitution(roles: readonly Role[]): boolean {
  return roles.some(role => ADMINISTRATION.includes(role));
}

export function teaches(roles: readonly Role[]): boolean {
  return roles.includes('teacher') || roles.includes('teaching_assistant');
}

export function studies(roles: readonly Role[]): boolean {
  return roles.includes('student');
}
