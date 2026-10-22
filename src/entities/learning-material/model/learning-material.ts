import type { LearningMaterialResponseDto } from '@/shared/api';

export type LearningMaterial = LearningMaterialResponseDto;
export type MaterialKind = LearningMaterial['kind'];

export const MATERIAL_KINDS: readonly MaterialKind[] = ['file', 'link', 'text'];

/** The server already orders by position; the neighbour lookups below rely on it. */
export function neighbour(
  materials: readonly LearningMaterial[],
  id: string,
  direction: -1 | 1,
): LearningMaterial | null {
  const index = materials.findIndex(material => material.id === id);

  if (index === -1) return null;

  return materials[index + direction] ?? null;
}

/**
 * Bytes are rendered in whole kilobytes: the exact figure is noise next to the
 * question a reader actually has, which is whether the download is big.
 */
export function kilobytes(sizeBytes: number): number {
  return Math.max(1, Math.round(sizeBytes / 1024));
}
