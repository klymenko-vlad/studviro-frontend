'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';

import {
  alternativesFor,
  type ConnectorKind,
  type ConnectorStatus,
} from '@/entities/institution-configuration';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectItem,
} from '@/shared/ui';

import type { InstitutionConfigurationFormValues } from '../model/schema';

const NONE = 'none';

type ConnectorFieldName = 'academicSystemConnector' | 'learningSystemConnector';

const FIELDS: { name: ConnectorFieldName; kind: ConnectorKind }[] = [
  { name: 'academicSystemConnector', kind: 'academic' },
  { name: 'learningSystemConnector', kind: 'learning' },
];

export function ConnectorFields({ statuses }: { statuses: readonly ConnectorStatus[] }) {
  const t = useTranslations('institutionSettings');
  const { control } = useFormContext<InstitutionConfigurationFormValues>();

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {FIELDS.map(({ name, kind }) => (
        <FormField
          key={name}
          control={control}
          name={name}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t(`connector.${kind}`)}</FormLabel>
              <FormControl>
                <Select
                  value={field.value === '' ? NONE : field.value}
                  onValueChange={value => {
                    field.onChange(value === NONE ? '' : value);
                  }}
                >
                  <SelectItem value={NONE}>{t('connectorNone')}</SelectItem>
                  {alternativesFor(statuses, kind).map(connector => (
                    <SelectItem key={connector} value={connector}>
                      {connector}
                    </SelectItem>
                  ))}
                </Select>
              </FormControl>
              <FormDescription>{t(`connectorHint.${kind}`)}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}
