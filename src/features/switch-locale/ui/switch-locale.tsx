'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { LOCALES, type AppLocale } from '@/shared/config';
import { Button } from '@/shared/ui';

import { switchLocale } from '../model/switch-locale';

interface SwitchLocaleProps {
  className?: string;
}

/**
 * Rendered as a radiogroup rather than a cycling button: a single toggle gives a
 * screen-reader user no way to know which of the languages is active. Mirrors
 * `features/theme-toggle` so the two controls behave identically.
 */
export function SwitchLocale({ className }: SwitchLocaleProps) {
  const t = useTranslations('locale');
  const active = useLocale();
  const [isPending, startTransition] = useTransition();

  return (
    <div
      role="radiogroup"
      aria-label={t('label')}
      className={`border-border inline-flex gap-1 rounded-lg border p-1 ${className ?? ''}`}
    >
      {LOCALES.map(locale => (
        <Button
          key={locale}
          role="radio"
          aria-checked={active === locale}
          // The label names the language in that language, so someone who
          // cannot read the current one can still find their own.
          aria-label={t(locale)}
          variant={active === locale ? 'secondary' : 'ghost'}
          size="sm"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await switchLocale(locale satisfies AppLocale);
            });
          }}
        >
          {t(locale)}
        </Button>
      ))}
    </div>
  );
}
