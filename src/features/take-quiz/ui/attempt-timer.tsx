'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/shared/lib';

import { clockParts, crossedWarning } from '../model/clock';

const pad = (value: number) => String(value).padStart(2, '0');

export function AttemptTimer({ left }: { left: number | null }) {
  const t = useTranslations('quiz.take.timer');
  const previous = useRef<number | null>(null);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (left === null) return;

    const mark =
      left === 0 && previous.current !== 0 ? 0 : crossedWarning(previous.current, left);
    previous.current = left;
    if (mark === null) return;

    setAnnouncement(
      mark === 0
        ? t('expired')
        : mark >= 60
          ? t('minutesLeft', { count: mark / 60 })
          : t('secondsLeft', { count: mark }),
    );
  }, [left, t]);

  if (left === null) {
    return <p className="text-muted-foreground text-sm">{t('none')}</p>;
  }

  const { hours, minutes, seconds } = clockParts(left);
  const shown =
    hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;

  return (
    <div className="flex items-center gap-2">
      <Clock aria-hidden className="text-muted-foreground size-4" />
      <span className="text-muted-foreground text-sm">{t('label')}</span>
      <span
        role="timer"
        aria-label={t('label')}
        className={cn(
          'font-mono text-base font-semibold tabular-nums',
          left <= 60 && 'text-destructive',
        )}
      >
        {shown}
      </span>
      <p className="sr-only" aria-live="polite" aria-atomic>
        {announcement}
      </p>
    </div>
  );
}
