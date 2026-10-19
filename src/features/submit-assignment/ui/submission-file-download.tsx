'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { submissionQueries } from '@/entities/submission';
import { toApiError } from '@/shared/api';
import {
  Button,
  FileScanBadge,
  useUnscannedDownloadConfirm,
  type FileScanStatus,
} from '@/shared/ui';

export function SubmissionFileDownload({
  institutionId,
  assignmentId,
  submissionId,
  fileId,
  filename,
  scanStatus,
}: {
  institutionId: string;
  assignmentId: string;
  submissionId: string;
  fileId: string;
  filename: string;
  scanStatus: FileScanStatus;
}) {
  const t = useTranslations('submissions');
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const { confirmThen, dialog } = useUnscannedDownloadConfirm();

  const download = async () => {
    setPending(true);

    try {
      const { url } = await queryClient.fetchQuery(
        submissionQueries.fileDownloadUrl({
          path: { institutionId, assignmentId, submissionId, fileId },
        }),
      );

      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(toApiError(error).message);
    } finally {
      setPending(false);
    }
  };

  if (scanStatus === 'infected') {
    return (
      <span className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground line-through">{filename}</span>
        <FileScanBadge status={scanStatus} />
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        aria-label={t('downloadNamed', { filename })}
        onClick={() => {
          confirmThen(scanStatus, () => void download());
        }}
      >
        {filename}
      </Button>
      <FileScanBadge status={scanStatus} />
      {dialog}
    </span>
  );
}
