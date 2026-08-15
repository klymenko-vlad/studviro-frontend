import type { RoleAssignmentResponseDto } from '@/shared/api';

export type RoleAssignment = RoleAssignmentResponseDto;
export type CanonicalRole = RoleAssignment['role'];
export type RoleScope = RoleAssignment['scopeType'];

/**
 * Ranked so the widest grant a person holds is the one they see first; two
 * assignments of equal reach keep the order the API returned them in.
 */
const SCOPE_REACH: Record<RoleScope, number> = {
  institution: 0,
  org_unit: 1,
  program: 2,
  course_offering: 3,
};

export function byWidestScope(a: RoleAssignment, b: RoleAssignment): number {
  return SCOPE_REACH[a.scopeType] - SCOPE_REACH[b.scopeType];
}

export function isCurrentlyValid(
  assignment: RoleAssignment,
  now: number = Date.now(),
): boolean {
  const from = assignment.validFrom ? Date.parse(assignment.validFrom) : undefined;
  const until = assignment.validUntil ? Date.parse(assignment.validUntil) : undefined;

  return (from === undefined || from <= now) && (until === undefined || until > now);
}
