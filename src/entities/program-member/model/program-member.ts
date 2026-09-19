import type { ProgramMemberResponseDto } from '@/shared/api';

export type ProgramMember = ProgramMemberResponseDto;

/** Only an active membership makes a student; the rest are the programme's history. */
export function isStudying(member: ProgramMember): boolean {
  return member.status === 'active';
}

/** Studying first, then by year, then by name — the order a roll is read in. */
export function byStanding(members: readonly ProgramMember[]): ProgramMember[] {
  return [...members].sort((a, b) => {
    if (isStudying(a) !== isStudying(b)) return isStudying(a) ? -1 : 1;
    if ((a.studyYear ?? 0) !== (b.studyYear ?? 0)) {
      return (a.studyYear ?? 0) - (b.studyYear ?? 0);
    }

    return a.displayName.localeCompare(b.displayName);
  });
}

export function countStudying(members: readonly ProgramMember[]): number {
  return members.filter(isStudying).length;
}
