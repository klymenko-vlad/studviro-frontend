import type { CourseResponseDto, ProgramResponseDto } from '@/shared/api';

export type Program = ProgramResponseDto;
export type CatalogueCourse = CourseResponseDto;

/** A row the source system owns: editing it here is a disagreement, not a correction. */
export function isImported(entry: { sourceSystem: string }): boolean {
  return entry.sourceSystem !== 'platform';
}

export function isOutOfStep(entry: { synchronizationStatus: string }): boolean {
  return entry.synchronizationStatus !== 'in_sync';
}
