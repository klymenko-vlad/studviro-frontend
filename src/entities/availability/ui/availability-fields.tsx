'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Switch,
} from '@/shared/ui';

import type { AvailabilityFormValues } from '../model/availability-form';

export function AvailabilityFields() {
  const t = useTranslations('availability');
  const { control } = useFormContext<AvailabilityFormValues>();

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-2 text-sm font-medium">{t('legend')}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {(['availableFrom', 'availableUntil'] as const).map(name => (
          <FormField
            key={name}
            control={control}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t(`field.${name}`)}</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
      <FormField
        control={control}
        name="hiddenUntilAvailable"
        render={({ field }) => (
          <FormItem>
            <div className="flex flex-row items-center gap-3">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>{t('field.hiddenUntilAvailable')}</FormLabel>
            </div>
            <FormDescription>{t('field.hint')}</FormDescription>
          </FormItem>
        )}
      />
    </fieldset>
  );
}
