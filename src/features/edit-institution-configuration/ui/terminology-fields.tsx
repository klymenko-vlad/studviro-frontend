'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';

import { isTerminologyLabelKey } from '@/entities/institution-configuration';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@/shared/ui';

import type { InstitutionConfigurationFormValues } from '../model/schema';

export function TerminologyFields({ keys }: { keys: readonly string[] }) {
  const t = useTranslations('institutionSettings');
  const { control } = useFormContext<InstitutionConfigurationFormValues>();

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {keys.map(key => (
        <FormField
          key={key}
          control={control}
          name={`terminology.${key}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isTerminologyLabelKey(key) ? t(`terminologyLabel.${key}`) : key}
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('terminologyPlaceholder')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}
