import { describe, expect, it } from 'vitest';

import { syncRuns, syncState } from '@/shared/test';

import {
  activeRun,
  failingDomains,
  isActive,
  latestRun,
  oldestSuccess,
  runDurationMs,
  touchedRecords,
} from './sync-run';

describe('sync run model', () => {
  it('treats a queued or running run as in flight and a finished one as not', () => {
    expect(isActive({ ...syncRuns[0]!, status: 'queued' })).toBe(true);
    expect(isActive({ ...syncRuns[0]!, status: 'running' })).toBe(true);
    expect(isActive({ ...syncRuns[0]!, status: 'partial' })).toBe(false);
    expect(isActive({ ...syncRuns[0]!, status: 'failed' })).toBe(false);
  });

  it('finds the run in flight, and none when every run has finished', () => {
    expect(activeRun(syncRuns)).toBeNull();
    expect(activeRun([{ ...syncRuns[0]!, status: 'running' }, syncRuns[1]!])?.id).toBe(
      syncRuns[0]!.id,
    );
  });

  it('takes the newest run first and answers null for no runs at all', () => {
    expect(latestRun(syncRuns)?.id).toBe(syncRuns[0]!.id);
    expect(latestRun([])).toBeNull();
  });

  it('measures a run only once it has both started and finished', () => {
    expect(runDurationMs(syncRuns[0]!)).toBe(3000);
    expect(runDurationMs({ ...syncRuns[0]!, finishedAt: null })).toBeNull();
    expect(runDurationMs({ ...syncRuns[0]!, startedAt: null })).toBeNull();
  });

  it('counts a record as changed when it was created, updated or removed', () => {
    expect(touchedRecords(syncRuns[0]!)).toBe(16);
    expect(touchedRecords({ created: 0, updated: 0, deleted: 0 })).toBe(0);
  });

  it('reports no freshness while any domain has never succeeded', () => {
    expect(oldestSuccess(syncState)).toBeNull();
    expect(oldestSuccess([])).toBeNull();
  });

  it('takes the oldest success as the freshness of the whole institution', () => {
    const succeeded = syncState.map((watermark, index) => ({
      ...watermark,
      lastSucceededAt:
        index === 0 ? '2026-06-01T09:00:00.000Z' : '2026-05-01T09:00:00.000Z',
    }));

    expect(oldestSuccess(succeeded)).toBe('2026-05-01T09:00:00.000Z');
  });

  it('names only the domains whose last attempt failed', () => {
    expect(failingDomains(syncState).map(watermark => watermark.domain)).toEqual([
      'enrollments',
    ]);
    expect(failingDomains([])).toEqual([]);
  });
});
