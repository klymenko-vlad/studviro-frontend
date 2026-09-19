'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { LOCALES, type AppLocale } from '@/shared/config';
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/shared/ui';

import { switchLocale } from '../model/switch-locale';

/**
 * Menu radio items rather than a pair of always-visible buttons: the language
 * is chosen roughly once, so it belongs in the account menu next to the theme.
 * Mirrors `features/theme-toggle` so the two behave identically.
 */
export function LocaleMenuItems() {
  const t = useTranslations('locale');
  const active = useLocale();
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
        {t('label')}
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={active}
        onValueChange={value => {
          startTransition(async () => {
            await switchLocale(value as AppLocale);
          });
        }}
      >
        {LOCALES.map(locale => (
          <DropdownMenuRadioItem key={locale} value={locale} disabled={isPending}>
            {t(locale)}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  );
}
