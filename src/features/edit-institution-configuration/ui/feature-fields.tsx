'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';

import { isFeatureLabelKey } from '@/entities/institution-configuration';
import { FormControl, FormField, FormItem, FormLabel, Switch } from '@/shared/ui';

import type { InstitutionConfigurationFormValues } from '../model/schema';

export function FeatureFields({
  flags,
  implemented,
}: {
  flags: readonly string[];
  implemented: readonly string[];
}) {
  const t = useTranslations('institutionSettings');
  const { control } = useFormContext<InstitutionConfigurationFormValues>();

  return (
    <ul className="flex flex-col gap-1">
      {flags.map(flag => {
        const gatesSomething = implemented.includes(flag);

        return (
          <li key={flag}>
            <FormField
              control={control}
              name={`features.${flag}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between gap-4 py-2">
                  <div className="flex flex-col gap-0.5">
                    <FormLabel className="font-normal">
                      {isFeatureLabelKey(flag) ? t(`featureLabel.${flag}`) : flag}
                    </FormLabel>
                    {gatesSomething ? null : (
                      <p
                        className="text-muted-foreground text-xs"
                        data-testid={`feature-unavailable-${flag}`}
                      >
                        {t('featureNotBuilt')}
                      </p>
                    )}
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      disabled={!gatesSomething}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </li>
        );
      })}
    </ul>
  );
}
