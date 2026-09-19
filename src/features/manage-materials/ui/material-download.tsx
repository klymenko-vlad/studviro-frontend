'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { learningMaterialQueries } from '@/entities/learning-material';
import { toApiError } from '@/shared/api';
import { Button } from '@/shared/ui';

/**
 * A download is a signed URL with a short life, fetched on the click rather
 * than rendered into the page: a link printed at render time would be stale
 * before most readers reached it, and would sit in the DOM for anyone looking.
 */
export function MaterialDownload({
  institutionId,
  spaceId,
  materialId,
  title,
}: {
  institutionId: string;
  spaceId: string;
  materialId: string;
  title: string;
}) {
  const t = useTranslations('materials');
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      aria-label={t('downloadNamed', { title })}
      onClick={async () => {
        setPending(true);

        try {
          const { url } = await queryClient.fetchQuery(
            learningMaterialQueries.downloadUrl({
              path: { institutionId, spaceId, materialId },
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
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {t('download')}
    </Button>
  );
}
