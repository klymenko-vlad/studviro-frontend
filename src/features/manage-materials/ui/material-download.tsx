'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { invalidateMyProgress } from '@/entities/completion';
import { learningMaterialQueries } from '@/entities/learning-material';
import { toApiError } from '@/shared/api';
import {
  Button,
  FileScanBadge,
  useUnscannedDownloadConfirm,
  type FileScanStatus,
} from '@/shared/ui';

/**
 * A download is a signed URL with a short life, fetched on the click rather
 * than rendered into the page: a link printed at render time would be stale
 * before most readers reached it, and would sit in the DOM for anyone looking.
 */
export function MaterialDownload({
  institutionId,
  spaceId,
  materialId,
  fileId,
  title,
  scanStatus,
}: {
  institutionId: string;
  spaceId: string;
  materialId: string;
  fileId?: string;
  title: string;
  scanStatus: FileScanStatus;
}) {
  const t = useTranslations('materials');
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const { confirmThen, dialog } = useUnscannedDownloadConfirm();

  const download = async () => {
    setPending(true);

    try {
      const path = { institutionId, spaceId, materialId };
      const { url } =
        fileId === undefined
          ? await queryClient.fetchQuery(learningMaterialQueries.downloadUrl({ path }))
          : await queryClient.fetchQuery(
              learningMaterialQueries.folderFileDownloadUrl({
                path: { ...path, fileId },
              }),
            );

      window.open(url, '_blank', 'noopener,noreferrer');
      void invalidateMyProgress(queryClient);
    } catch (error) {
      toast.error(toApiError(error).message);
    } finally {
      setPending(false);
    }
  };

  if (scanStatus === 'infected') return <FileScanBadge status={scanStatus} />;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        aria-label={t('downloadNamed', { title })}
        onClick={() => {
          confirmThen(scanStatus, () => void download());
        }}
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {t('download')}
      </Button>
      <FileScanBadge status={scanStatus} />
      {dialog}
    </>
  );
}
