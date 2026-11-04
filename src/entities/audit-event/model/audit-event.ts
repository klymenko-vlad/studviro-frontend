import type { AuditEventResponseDto } from '@/shared/api';

export type AuditEvent = AuditEventResponseDto;
export type AuditAction = AuditEvent['action'];

export const AUDIT_ACTIONS: readonly AuditAction[] = [
  'grade.proposed',
  'grade.published',
  'role.granted',
  'role.revoked',
  'enrollment.corrected',
  'exam_term.cancelled',
  'exam_registration.attendance_recorded',
  'personal_data.erased',
];

/**
 * The whole value of an audit row is the change, not the final state. Render
 * the pairs that actually differ and nothing else — a diff of twenty
 * unchanged fields hides the one that moved.
 */
export interface AuditChange {
  readonly field: string;
  readonly before: string | null;
  readonly after: string | null;
}

export function changesOf(event: AuditEvent): AuditChange[] {
  const before = event.before ?? {};
  const after = event.after ?? {};
  const fields = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();

  return fields
    .map(field => ({
      field,
      before: render(before[field]),
      after: render(after[field]),
    }))
    .filter(change => change.before !== change.after);
}

function render(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  return JSON.stringify(value);
}

/**
 * next-intl reads a dot in a key as nesting, so `grade.published` cannot be
 * a message key. The action stays the server's wire value and the label is
 * looked up under a dot-free one.
 */
const LABEL_KEYS: Readonly<Record<AuditAction, string>> = {
  'grade.proposed': 'gradeProposed',
  'grade.published': 'gradePublished',
  'role.granted': 'roleGranted',
  'role.revoked': 'roleRevoked',
  'enrollment.corrected': 'enrollmentCorrected',
  'exam_term.cancelled': 'examTermCancelled',
  'exam_registration.attendance_recorded': 'examAttendanceRecorded',
  'personal_data.erased': 'personalDataErased',
  'discussion.hidden': 'discussionHidden',
  'discussion.restored': 'discussionRestored',
  'learning_space.imported': 'learningSpaceImported',
};

export function labelKeyFor(action: AuditAction): string {
  return LABEL_KEYS[action];
}
