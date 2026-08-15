import type { InstitutionResponseDto } from '@/shared/api';

export type Institution = InstitutionResponseDto;

export function institutionName(
  institutions: readonly Institution[],
  id: string,
): string | undefined {
  return institutions.find(institution => institution.id === id)?.name;
}
