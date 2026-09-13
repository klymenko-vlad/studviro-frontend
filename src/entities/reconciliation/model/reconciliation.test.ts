import { describe, expect, it } from 'vitest';

import { reconciliationReport } from '@/shared/test';

import {
  checkedDomains,
  countByKind,
  disagreeingDomains,
  isClean,
  isResolvable,
} from './reconciliation';

describe('reconciliation model', () => {
  it('calls a report with no discrepancy clean, and one with any dirty', () => {
    expect(isClean(reconciliationReport)).toBe(false);
    expect(isClean({ ...reconciliationReport, discrepancyCount: 0 })).toBe(true);
  });

  it('keeps only the domains that have something to say, worst first', () => {
    const domains = disagreeingDomains(reconciliationReport);

    expect(domains.map(domain => domain.domain)).toEqual(['courses']);
  });

  it('keeps a failed domain even though it counted no discrepancy', () => {
    const report = {
      ...reconciliationReport,
      domains: reconciliationReport.domains.map(domain => ({
        ...domain,
        discrepancyCount: 0,
        status: domain.domain === 'enrollments' ? ('failed' as const) : domain.status,
      })),
    };

    expect(disagreeingDomains(report).map(domain => domain.domain)).toEqual([
      'enrollments',
    ]);
  });

  it('counts the domains that were actually compared', () => {
    expect(checkedDomains(reconciliationReport)).toHaveLength(2);
    expect(
      checkedDomains({
        ...reconciliationReport,
        domains: reconciliationReport.domains.map(domain => ({
          ...domain,
          status: 'skipped' as const,
        })),
      }),
    ).toHaveLength(0);
  });

  it('tallies the listed discrepancies by kind', () => {
    expect(countByKind(reconciliationReport)).toEqual({
      missing_in_platform: 1,
      stale: 1,
    });
  });

  it('offers no resolution for a record the platform never took in', () => {
    const [missing, stale] = reconciliationReport.domains[0]!.discrepancies;

    expect(isResolvable(missing!)).toBe(false);
    expect(isResolvable(stale!)).toBe(true);
  });

  it('offers no resolution for a discrepancy that names no canonical row', () => {
    expect(
      isResolvable({
        kind: 'conflict',
        externalId: null,
        canonicalId: null,
        sourceUpdatedAt: null,
        platformUpdatedAt: null,
        detail: 'An orphan',
      }),
    ).toBe(false);
  });
});
