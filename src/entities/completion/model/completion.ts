import type {
  CompletionColumnDto,
  ItemProgressDto,
  ProgressResponseDto,
  StudentCompletionDto,
} from '@/shared/api';

export type Progress = ProgressResponseDto;
export type ItemProgress = ItemProgressDto;
export type CompletionState = ItemProgress['state'];
export type CompletionRule = ItemProgress['rule'];
export type CompletionColumn = CompletionColumnDto;
export type StudentCompletion = StudentCompletionDto;

export const MATERIAL_COMPLETION_RULES = ['none', 'manual', 'viewed'] as const;
export const ASSIGNMENT_COMPLETION_RULES = [
  'none',
  'manual',
  'submitted',
  'marked',
  'passed',
] as const;

export interface Tally {
  done: number;
  total: number;
}

export function isDone(state: CompletionState): boolean {
  return state === 'complete' || state === 'complete_pass';
}

export function progressOf(
  progress: Progress | undefined,
  id: string,
): ItemProgress | undefined {
  return progress?.items.find(item => item.id === id);
}

export function sectionTally(
  progress: Progress | undefined,
  sectionId: string | null,
): Tally | undefined {
  return progress?.sections.find(section => section.sectionId === sectionId);
}
