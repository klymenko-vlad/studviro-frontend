import type {
  StartSyncRunDto,
  SyncDomainResultResponseDto,
  SyncRunDetailResponseDto,
  SyncRunResponseDto,
  SyncWatermarkResponseDto,
} from '@/shared/api';

export type SyncRun = SyncRunResponseDto;
export type SyncRunDetail = SyncRunDetailResponseDto;
export type SyncDomainResult = SyncDomainResultResponseDto;
export type SyncWatermark = SyncWatermarkResponseDto;
export type SyncRunStatus = SyncRun['status'];
export type SyncRunMode = SyncRun['mode'];
export type SyncSourceSystem = NonNullable<StartSyncRunDto['sourceSystem']>;
export type SyncDomain = SyncWatermark['domain'];

const ACTIVE_STATUSES: readonly SyncRunStatus[] = ['queued', 'running'];

export function isActive(run: SyncRun): boolean {
  return ACTIVE_STATUSES.includes(run.status);
}

export function activeRun(runs: readonly SyncRun[]): SyncRun | null {
  return runs.find(isActive) ?? null;
}

export function latestRun(runs: readonly SyncRun[]): SyncRun | null {
  return runs[0] ?? null;
}

export function runDurationMs(run: SyncRun): number | null {
  if (run.startedAt === null || run.finishedAt === null) return null;

  return Date.parse(run.finishedAt) - Date.parse(run.startedAt);
}

export function touchedRecords(counts: {
  created: number;
  updated: number;
  deleted: number;
}): number {
  return counts.created + counts.updated + counts.deleted;
}

/**
 * The oldest successful domain read, because a picture is only as fresh as the
 * domain that has been waiting longest. Domains that have never succeeded make
 * the whole institution stale, so they answer `null`.
 */
export function oldestSuccess(watermarks: readonly SyncWatermark[]): string | null {
  if (watermarks.length === 0) return null;

  let oldest: string | null = null;

  for (const watermark of watermarks) {
    if (watermark.lastSucceededAt === null) return null;
    if (oldest === null || Date.parse(watermark.lastSucceededAt) < Date.parse(oldest)) {
      oldest = watermark.lastSucceededAt;
    }
  }

  return oldest;
}

export function failingDomains(watermarks: readonly SyncWatermark[]): SyncWatermark[] {
  return watermarks.filter(watermark => watermark.lastStatus === 'failed');
}
