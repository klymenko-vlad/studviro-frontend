'use client';

import { useQuery } from '@tanstack/react-query';

import { institutionConfigurationQueries } from '../api/institution-configuration-queries';
import type { InstitutionConfiguration } from './institution-configuration';

export type FeatureFlag = InstitutionConfiguration['implementedFeatures'][number];

export interface InstitutionFeatures {
  /** The server's own answer. Pending, everything is treated as on. */
  isEnabled: (flag: FeatureFlag) => boolean;
  isImplemented: (flag: FeatureFlag) => boolean;
  isPending: boolean;
}

/**
 * Turning a feature off has to hide it here as well as refuse it there — the
 * guard is the rule, this only stops the app offering a door it would slam.
 */
export function useInstitutionFeatures(institutionId: string): InstitutionFeatures {
  const { data, isPending } = useQuery(
    institutionConfigurationQueries.detail({ path: { institutionId } }),
  );

  return {
    isEnabled: flag => data?.features[flag] ?? true,
    isImplemented: flag => data?.implementedFeatures.includes(flag) ?? true,
    isPending,
  };
}
