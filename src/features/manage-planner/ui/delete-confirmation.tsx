'use client';

import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/ui';

export function DeleteConfirmation({
  question,
  pending,
  onConfirm,
}: {
  question: string;
  pending: boolean;
  onConfirm: () => void;
}) {
  const t = useTranslations('planner');
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="text-destructive mr-auto"
        onClick={() => {
          setAsking(true);
        }}
      >
        {t('delete')}
      </Button>
    );
  }

  return (
    <div role="alert" className="mr-auto flex flex-wrap items-center gap-2">
      <span className="text-sm">{question}</span>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={onConfirm}
      >
        {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
        {t('confirmDelete')}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setAsking(false);
        }}
      >
        {t('keep')}
      </Button>
    </div>
  );
}
