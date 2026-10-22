'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Download, LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { apiQueries, toApiError, type PersonalDataExportDto } from '@/shared/api';
import { Button } from '@/shared/ui';

/**
 * Self-service: a person may take a copy of their own data whenever they
 * like. The file is built in the browser from the response rather than served
 * as an attachment, so the export route stays an ordinary JSON endpoint and
 * the same data is available to anything else that wants it.
 */
export function ExportMyData({ institutionId }: { institutionId: string }) {
  const t = useTranslations('personalData');
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  const download = async () => {
    setPending(true);
    try {
      const data = await queryClient.fetchQuery(
        apiQueries.exportMyPersonalDataOptions({ path: { institutionId } }),
      );

      save(data);
      toast.success(t('exported'));
    } catch (error: unknown) {
      toast.error(toApiError(error).message);
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending}
      onClick={() => {
        void download();
      }}
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" aria-hidden />
      )}
      {t('export')}
    </Button>
  );
}

function save(data: PersonalDataExportDto): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `studviro-personal-data-${data.generatedAt.slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
