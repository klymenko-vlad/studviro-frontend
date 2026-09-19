'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useThemeStore, type Theme } from '@/shared/model';
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/shared/ui';

const OPTIONS: { value: Theme; Icon: typeof Sun }[] = [
  { value: 'light', Icon: Sun },
  { value: 'dark', Icon: Moon },
  { value: 'system', Icon: Monitor },
];

/**
 * Menu radio items rather than a cycling button: a single toggle gives a screen
 * reader user no way to know which of three states is active. Lives inside the
 * account menu because the theme is a preference, not a destination, and five
 * always-visible chrome buttons for two settings was the old cost.
 */
export function ThemeMenuItems() {
  const t = useTranslations('theme');
  const theme = useThemeStore(state => state.theme);
  const setTheme = useThemeStore(state => state.setTheme);

  return (
    <>
      <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
        {t('label')}
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={theme}
        onValueChange={value => {
          setTheme(value as Theme);
        }}
      >
        {OPTIONS.map(({ value, Icon }) => (
          <DropdownMenuRadioItem key={value} value={value}>
            <Icon aria-hidden className="text-muted-foreground" />
            {t(value)}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  );
}
