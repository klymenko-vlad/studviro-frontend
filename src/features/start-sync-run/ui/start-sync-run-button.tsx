'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { syncRunMutations, syncRunQueries, type SyncRunMode } from '@/entities/sync-run';
import { toApiError } from '@/shared/api';
import { Button, Label, Select, SelectItem } from '@/shared/ui';

const MODES: readonly SyncRunMode[] = ['incremental', 'full'];

export function StartSyncRunButton({
  institutionId,
  disabled = false,
}: {
  institutionId: string;
  disabled?: boolean;
}) {
  const t = useTranslations('sync');
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<SyncRunMode>('incremental');

  const mutation = useMutation({
    ...syncRunMutations.start(),
    onSuccess: async () => {
      toast.success(t('started'));
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: syncRunQueries.listKey({ path: { institutionId } }),
        }),
        queryClient.invalidateQueries({
          queryKey: syncRunQueries.stateKey({ path: { institutionId } }),
        }),
      ]);
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  const pending = mutation.isPending;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="sync-mode">{t('modeLabel')}</Label>
        <Select
          id="sync-mode"
          className="w-48"
          value={mode}
          onValueChange={value => {
            setMode(value as SyncRunMode);
          }}
          disabled={pending || disabled}
        >
          {MODES.map(candidate => (
            <SelectItem key={candidate} value={candidate}>
              {t(`mode.${candidate}`)}
            </SelectItem>
          ))}
        </Select>
      </div>

      <Button
        type="button"
        disabled={pending || disabled}
        onClick={() => {
          mutation.mutate({ path: { institutionId }, body: { mode } });
        }}
      >
        {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
        {pending ? t('starting') : t('runNow')}
      </Button>
    </div>
  );
}
