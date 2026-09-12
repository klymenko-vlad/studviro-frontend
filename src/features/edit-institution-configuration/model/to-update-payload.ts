import type { InstitutionConfiguration } from '@/entities/institution-configuration';
import type { UpdateInstitutionConfigurationDto } from '@/shared/api';

import type { InstitutionConfigurationFormValues } from './schema';

const blankToNull = (value: string): string | null =>
  value.trim().length === 0 ? null : value.trim();

export function toFormValues(
  configuration: InstitutionConfiguration,
): InstitutionConfigurationFormValues {
  return {
    defaultLocale: configuration.defaultLocale === 'sk' ? 'sk' : 'en',
    timezone: configuration.timezone,
    terminology: Object.fromEntries(
      Object.entries(configuration.terminology).map(([key, label]) => [key, label ?? '']),
    ),
    features: { ...configuration.features },
    academicSystemConnector: configuration.connectors.academicSystem ?? '',
    learningSystemConnector: configuration.connectors.learningSystem ?? '',
  };
}

export function toUpdatePayload(
  values: InstitutionConfigurationFormValues,
): UpdateInstitutionConfigurationDto {
  return {
    defaultLocale: values.defaultLocale,
    timezone: values.timezone.trim(),
    terminology: Object.fromEntries(
      Object.entries(values.terminology).map(([key, label]) => [key, blankToNull(label)]),
    ),
    features: values.features,
    academicSystemConnector: blankToNull(values.academicSystemConnector),
    learningSystemConnector: blankToNull(values.learningSystemConnector),
  };
}
