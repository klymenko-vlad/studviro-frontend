'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { FolderFiles, MaterialDownload } from '@/features/manage-materials';
import { AvailabilityNote } from '@/entities/availability';
import {
  isEmbeddable,
  kilobytes,
  type LearningMaterial,
} from '@/entities/learning-material';
import { institutionRoutes, Link } from '@/shared/config';
import { Badge, Button } from '@/shared/ui';

export function OutlineMaterial({
  institutionId,
  offeringId,
  spaceId,
  material,
  manageable,
  actions,
  onOpen,
  readOnly = false,
}: {
  institutionId: string;
  offeringId: string;
  spaceId: string;
  material: LearningMaterial;
  manageable: boolean;
  actions: ReactNode;
  onOpen?: (materialId: string) => void;
  readOnly?: boolean;
}) {
  const t = useTranslations('materials');
  const titleOnly =
    !manageable &&
    (material.availability === 'scheduled' || material.restriction?.locked === true);
  const shownInline =
    (material.kind === 'text' && material.body !== null) ||
    (material.kind === 'video' && material.url !== null);
  const [folderOpen, setFolderOpen] = useState(false);

  useEffect(() => {
    if (shownInline) onOpen?.(material.id);
  }, [shownInline, onOpen, material.id]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {material.kind === 'label' ? (
          <p className="whitespace-pre-line">{material.body ?? material.title}</p>
        ) : (
          <span className="font-medium">{material.title}</span>
        )}
        {material.kind === 'label' && !manageable ? null : (
          <Badge variant="secondary">{t(`kind.${material.kind}`)}</Badge>
        )}
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
          onClick={() => onOpen?.(material.id)}
        >
          {material.url}
        </a>
      ) : null}

      {material.kind === 'page' && !titleOnly ? (
        <Link
          href={`${institutionRoutes(institutionId).courses}/${offeringId}/spaces/${spaceId}/pages/${material.id}`}
          className="text-primary self-start text-sm underline underline-offset-4"
          aria-label={t('page.readNamed', { title: material.title })}
        >
          {t('page.read')}
        </Link>
      ) : null}

      {material.kind === 'video' &&
      material.url !== null &&
      isEmbeddable(material.url) ? (
        <div className="aspect-video w-full max-w-2xl overflow-hidden rounded-md border">
          <iframe
            src={material.url}
            title={t('video.frameNamed', { title: material.title })}
            loading="lazy"
            allow="encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            className="size-full"
          />
        </div>
      ) : null}

      {material.kind === 'folder' && !titleOnly ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            aria-expanded={folderOpen}
            onClick={() => {
              setFolderOpen(current => !current);
            }}
          >
            {folderOpen ? t('folder.hide') : t('folder.show')}
          </Button>
          {folderOpen ? (
            <FolderFiles
              institutionId={institutionId}
              spaceId={spaceId}
              material={material}
              manageable={manageable && !readOnly}
              readOnly={readOnly}
              onOpen={onOpen}
            />
          ) : null}
        </>
      ) : null}

      {material.kind === 'file' && !titleOnly ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {material.filename ?? t('unnamedFile')}
            {material.sizeBytes === null
              ? null
              : ` · ${t('size', { kilobytes: kilobytes(material.sizeBytes) })}`}
          </span>
          {readOnly ? null : (
            <MaterialDownload
              institutionId={institutionId}
              spaceId={spaceId}
              materialId={material.id}
              title={material.title}
              scanStatus={material.scanStatus}
            />
          )}
        </div>
      ) : null}
    </>
  );
}
