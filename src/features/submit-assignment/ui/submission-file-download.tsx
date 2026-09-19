'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { submissionQueries } from '@/entities/submission';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

export function SubmissionFileDownload({
  institutionId,
  assignmentId,
  submissionId,
  fileId,
  filename,
}: {
  institutionId: string;
  assignmentId: string;
  submissionId: string;
  fileId: string;
  filename: string;
}) {
  const t = useTranslations('submissions');
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      aria-label={t('downloadNamed', { filename })}
      onClick={async () => {
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
      }}
    >
      {filename}
    </Button>
  );
}
