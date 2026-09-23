import type { WaitingStudentResponseDto } from '@/shared/api';

export type WaitingStudent = WaitingStudentResponseDto;

export const WAITLIST_DECISIONS = ['active', 'rejected'] as const;
export type WaitlistDecision = (typeof WAITLIST_DECISIONS)[number];
