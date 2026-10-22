'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { institutionConfigurationQueries } from '../api/institution-configuration-queries';
import type { InstitutionConfiguration } from './institution-configuration';

export type TerminologyKey = keyof InstitutionConfiguration['terminology'] & string;

/**
 * What this institution calls a thing. An override is the institution's own
 * word and is never translated; without one the platform's translated label
 * stands.
 */
export function useTerminology(institutionId: string): (key: TerminologyKey) => string {
  const t = useTranslations('terminology');
  const { data } = useQuery(
    institutionConfigurationQueries.detail({ path: { institutionId } }),
  );

  return key => data?.terminology[key] ?? t(key);
}
