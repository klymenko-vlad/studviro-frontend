'use client';

import { useState, type ReactNode } from 'react';
import { ShieldAlert, ShieldX } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from './badge';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';

export type FileScanStatus = 'unscanned' | 'pending' | 'clean' | 'infected';

export function FileScanBadge({ status }: { status: FileScanStatus }) {
  const t = useTranslations('fileScan');

  if (status === 'pending') {
    return (
      <Badge variant="warning" title={t('pendingHint')}>
        <ShieldAlert aria-hidden />
        {t('pending')}
      </Badge>
    );
  }
  if (status === 'infected') {
    return (
      <Badge variant="destructive">
        <ShieldX aria-hidden />
        {t('infected')}
      </Badge>
    );
  }

  return null;
}

/**
 * Wraps a download so a file the scanner has not checked yet is downloaded
 * only after the person says so. Render `dialog` next to the trigger.
 */
export function useUnscannedDownloadConfirm(): {
  confirmThen: (status: FileScanStatus, download: () => void) => void;
  dialog: ReactNode;
} {
  const t = useTranslations('fileScan');
  const [waiting, setWaiting] = useState<(() => void) | null>(null);

  const dialog = (
    <Dialog
      open={waiting !== null}
      onOpenChange={open => {
        if (!open) setWaiting(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('confirmTitle')}</DialogTitle>
          <DialogDescription>{t('confirmBody')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setWaiting(null);
            }}
          >
            {t('cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => {
              const download = waiting;
              setWaiting(null);
              download?.();
            }}
          >
            {t('downloadAnyway')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return {
    confirmThen: (status, download) => {
      if (status === 'pending') setWaiting(() => download);
      else download();
    },
    dialog,
  };
}
