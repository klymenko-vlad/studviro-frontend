import type {
  DiscrepancyResponseDto,
  DomainReconciliationResponseDto,
  ReconciliationReportResponseDto,
  ReconciliationResolutionResponseDto,
} from '@/shared/api';

export type ReconciliationReport = ReconciliationReportResponseDto;
export type DomainReconciliation = DomainReconciliationResponseDto;
export type Discrepancy = DiscrepancyResponseDto;
export type DiscrepancyKind = Discrepancy['kind'];
export type ReconciledDomain = DomainReconciliation['domain'];
export type ReconciliationResolution = ReconciliationResolutionResponseDto;
export type ReconciliationAction = ReconciliationResolution['action'];

/**
 * A record the platform never took in has no canonical row to accept or override,
 * so the only remedy is a full synchronization run.
 */
export function isResolvable(discrepancy: Discrepancy): boolean {
  return discrepancy.kind !== 'missing_in_platform' && discrepancy.canonicalId !== null;
}

export function resolvedKeys(
  resolutions: readonly ReconciliationResolution[],
): Set<string> {
  return new Set(
    resolutions.map(resolution => `${resolution.domain}:${resolution.canonicalId}`),
  );
}

export function discrepancyKey(
  domain: ReconciledDomain,
  discrepancy: Discrepancy,
): string {
  return `${domain}:${discrepancy.canonicalId}`;
}

export function isClean(report: ReconciliationReport): boolean {
  return report.discrepancyCount === 0;
}

/** Domains the report has something to say about, worst first. */
export function disagreeingDomains(report: ReconciliationReport): DomainReconciliation[] {
  return report.domains
    .filter(domain => domain.discrepancyCount > 0 || domain.status === 'failed')
    .sort((left, right) => right.discrepancyCount - left.discrepancyCount);
}

export function checkedDomains(report: ReconciliationReport): DomainReconciliation[] {
  return report.domains.filter(domain => domain.status === 'checked');
}

export function countByKind(
  report: ReconciliationReport,
): Partial<Record<DiscrepancyKind, number>> {
  const counts: Partial<Record<DiscrepancyKind, number>> = {};

  for (const domain of report.domains) {
    for (const discrepancy of domain.discrepancies) {
      counts[discrepancy.kind] = (counts[discrepancy.kind] ?? 0) + 1;
    }
  }

  return counts;
}
