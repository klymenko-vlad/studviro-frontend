import type {
  DiscrepancyResponseDto,
  DomainReconciliationResponseDto,
  ReconciliationReportResponseDto,
} from '@/shared/api';

export type ReconciliationReport = ReconciliationReportResponseDto;
export type DomainReconciliation = DomainReconciliationResponseDto;
export type Discrepancy = DiscrepancyResponseDto;
export type DiscrepancyKind = Discrepancy['kind'];
export type ReconciledDomain = DomainReconciliation['domain'];

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
