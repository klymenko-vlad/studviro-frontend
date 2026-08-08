'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useThemeStore, type Theme } from '@/shared/model';
import { Button } from '@/shared/ui';

const OPTIONS: { value: Theme; Icon: typeof Sun }[] = [
  { value: 'light', Icon: Sun },
  { value: 'dark', Icon: Moon },
  { value: 'system', Icon: Monitor },
];

/**
 * Rendered as a radiogroup rather than a cycling button: a single toggle gives a
 * screen-reader user no way to know which of three states is active.
 */
export function ThemeToggle() {
  const t = useTranslations('theme');
  const theme = useThemeStore(state => state.theme);
  const setTheme = useThemeStore(state => state.setTheme);

  return (
    <div
      role="radiogroup"
      aria-label={t('label')}
      className="bg-muted/60 inline-flex gap-1 rounded-lg border p-1"
    >
      {OPTIONS.map(({ value, Icon }) => (
        <Button
          key={value}
          role="radio"
          aria-checked={theme === value}
          aria-label={t(value)}
          variant={theme === value ? 'secondary' : 'ghost'}
          size="icon-sm"
          className={theme === value ? 'shadow-xs' : undefined}
          onClick={() => {
            setTheme(value);
          }}
        >
          <Icon aria-hidden />
        </Button>
      ))}
    </div>
  );
}
