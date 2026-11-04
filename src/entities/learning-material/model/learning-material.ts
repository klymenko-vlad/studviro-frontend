import type { FolderFileResponseDto, LearningMaterialResponseDto } from '@/shared/api';

export type LearningMaterial = LearningMaterialResponseDto;
export type MaterialKind = LearningMaterial['kind'];
export type FolderFile = FolderFileResponseDto;

export const MATERIAL_KINDS: readonly MaterialKind[] = [
  'file',
  'folder',
  'link',
  'text',
  'page',
  'label',
  'video',
];

const EMBED_ORIGINS = ['https://www.youtube-nocookie.com', 'https://player.vimeo.com'];

export function isEmbeddable(url: string): boolean {
  try {
    const parsed = new URL(url);

    return EMBED_ORIGINS.includes(parsed.origin) && parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Bytes are rendered in whole kilobytes: the exact figure is noise next to the
 * question a reader actually has, which is whether the download is big.
 */
export function kilobytes(sizeBytes: number): number {
  return Math.max(1, Math.round(sizeBytes / 1024));
}
