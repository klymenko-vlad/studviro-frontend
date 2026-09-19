'use client';

import { Settings2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { LocaleMenuItems } from '@/features/switch-locale';
import { ThemeMenuItems } from '@/features/theme-toggle';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui';

/**
 * The theme and the language for a visitor with no account to hang them off.
 * Signed in, the same two groups live in `AccountMenu`.
 */
export function PreferencesMenu() {
  const t = useTranslations('nav');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('preferences')}>
          <Settings2 aria-hidden />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <ThemeMenuItems />
        <DropdownMenuSeparator />
        <LocaleMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
