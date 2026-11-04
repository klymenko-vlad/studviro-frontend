import 'server-only';

import type { LearningMaterialResponseDto } from '@/shared/api';
import { apiOrigin, getAccessToken } from '@/shared/auth';

export interface PageAddress {
  institutionId: string;
  spaceId: string;
  materialId: string;
}

export async function readPage(
  address: PageAddress,
): Promise<LearningMaterialResponseDto | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  const { institutionId, spaceId, materialId } = address;
  const response = await fetch(
    `${apiOrigin()}/api/v1/institutions/${encodeURIComponent(institutionId)}/learning-spaces/${encodeURIComponent(spaceId)}/materials/${encodeURIComponent(materialId)}`,
    { headers: { authorization: `Bearer ${accessToken}` }, cache: 'no-store' },
  );
  if (!response.ok) return null;

  const material = (await response.json()) as LearningMaterialResponseDto;

  return material.kind === 'page' ? material : null;
}
