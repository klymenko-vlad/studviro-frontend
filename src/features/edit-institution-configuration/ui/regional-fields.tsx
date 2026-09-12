'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';

import { LOCALES } from '@/shared/config';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectItem,
} from '@/shared/ui';

import type { InstitutionConfigurationFormValues } from '../model/schema';

export function RegionalFields() {
  const t = useTranslations('institutionSettings');
  const languages = useTranslations('locale');
  const { control } = useFormContext<InstitutionConfigurationFormValues>();

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FormField
        control={control}
        name="defaultLocale"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('defaultLocale')}</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                {LOCALES.map(locale => (
                  <SelectItem key={locale} value={locale}>
                    {languages(locale)}
                  </SelectItem>
                ))}
              </Select>
            </FormControl>
            <FormDescription>{t('defaultLocaleHint')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="timezone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('timezone')}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>{t('timezoneHint')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
