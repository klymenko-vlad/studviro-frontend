'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import {
  MaterialActions,
  MaterialDownload,
  MaterialForm,
} from '@/features/manage-materials';
import { kilobytes, learningMaterialQueries } from '@/entities/learning-material';
import { usePermissions } from '@/entities/permission';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/shared/ui';

export function OfferingMaterials({
  institutionId,
  spaceId,
}: {
  institutionId: string;
  spaceId: string;
}) {
  const t = useTranslations('materials');
  const { can } = usePermissions(institutionId);
  const manageable = can('offering:manage');

  const materials = useQuery(
    learningMaterialQueries.list({ path: { institutionId, spaceId } }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {manageable ? (
          <MaterialForm institutionId={institutionId} spaceId={spaceId} />
        ) : null}

        {materials.isPending ? (
          <Skeleton className="h-20 w-full" data-testid="offering-materials-loading" />
        ) : materials.isError ? (
          <p className="text-muted-foreground text-sm">{t('error')}</p>
        ) : materials.data.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('empty')}</p>
        ) : (
          <ul className="flex flex-col gap-4" aria-label={t('title')}>
            {materials.data.map(material => (
              <li key={material.id} className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{material.title}</span>
                  <Badge variant="secondary">{t(`kind.${material.kind}`)}</Badge>
                  {material.visible ? null : (
                    <Badge variant="outline">{t('hidden')}</Badge>
                  )}
                  {manageable ? (
                    <MaterialActions
                      institutionId={institutionId}
                      spaceId={spaceId}
                      material={material}
                      materials={materials.data}
                    />
                  ) : null}
                </div>

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

                {material.kind === 'file' ? (
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
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
