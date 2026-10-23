'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { MaterialDownload } from '@/features/manage-materials';
import { AvailabilityNote } from '@/entities/availability';
import { kilobytes, type LearningMaterial } from '@/entities/learning-material';
import { Badge } from '@/shared/ui';

export function OutlineMaterial({
  institutionId,
  spaceId,
  material,
  manageable,
  actions,
}: {
  institutionId: string;
  spaceId: string;
  material: LearningMaterial;
  manageable: boolean;
  actions: ReactNode;
}) {
  const t = useTranslations('materials');
  const titleOnly = !manageable && material.availability === 'scheduled';

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{material.title}</span>
        <Badge variant="secondary">{t(`kind.${material.kind}`)}</Badge>
        {material.visible ? null : <Badge variant="outline">{t('hidden')}</Badge>}
        {manageable ? <AvailabilityNote item={material} audience="author" /> : null}
        {actions}
      </div>

      {manageable ? null : <AvailabilityNote item={material} audience="student" />}

      {material.description === null ? null : (
        <p className="text-muted-foreground text-sm">{material.description}</p>
      )}

      {material.kind === 'text' && material.body !== null ? (
        <p className="text-sm whitespace-pre-line">{material.body}</p>
      ) : null}

      {material.kind === 'link' && material.url !== null ? (
        <a
          href={material.url}
          rel="noopener noreferrer"
          target="_blank"
          className="text-primary text-sm underline underline-offset-4"
        >
          {material.url}
        </a>
      ) : null}

      {material.kind === 'file' && !titleOnly ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {material.filename ?? t('unnamedFile')}
            {material.sizeBytes === null
              ? null
              : ` · ${t('size', { kilobytes: kilobytes(material.sizeBytes) })}`}
          </span>
          <MaterialDownload
            institutionId={institutionId}
            spaceId={spaceId}
            materialId={material.id}
            title={material.title}
            scanStatus={material.scanStatus}
          />
        </div>
      ) : null}
    </>
  );
}
