import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  errorResponse,
  renderWithProviders,
  screen,
  server,
  syncRuns,
  syncState,
} from '@/shared/test';

import { SyncMonitor } from './sync-monitor';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const BASE = `/api/proxy/api/v1/institutions/${INSTITUTION}/synchronization`;
const RUNS_URL = `${BASE}/runs`;
const STATE_URL = `${BASE}/state`;

describe('SyncMonitor', () => {
  it('lists every recent run with its mode, counts and trigger', async () => {
    renderWithProviders(<SyncMonitor institutionId={INSTITUTION} canRun />);

    expect(await screen.findByText('Run history')).toBeInTheDocument();
    expect(screen.getAllByText('120 fetched · 16 changed').length).toBeGreaterThan(0);
    expect(screen.getByText('500 fetched · 500 changed')).toBeInTheDocument();
    expect(screen.getByText(/Scheduled · mock-sis/)).toBeInTheDocument();
  });

  it('reports how fresh each domain is and names the one that failed', async () => {
    renderWithProviders(<SyncMonitor institutionId={INSTITUTION} canRun />);

    expect(await screen.findByText('Freshness by domain')).toBeInTheDocument();
    expect(screen.getAllByText('Enrolments').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText('Enrolments could not be read in full').length,
    ).toBeGreaterThan(0);
  });

  it('says the picture is incomplete while a domain has never succeeded', async () => {
    renderWithProviders(<SyncMonitor institutionId={INSTITUTION} canRun />);

    expect(await screen.findByTestId('sync-freshness-summary')).toHaveTextContent(
      'At least one domain has never synchronized successfully.',
    );
    expect(screen.getByText('Some domains are failing')).toBeInTheDocument();
  });

  it('dates the freshness once every domain has succeeded', async () => {
    server.use(
      http.get(STATE_URL, () =>
        HttpResponse.json(
          syncState.map(watermark => ({
            ...watermark,
            lastStatus: 'succeeded',
            lastSucceededAt: '2026-06-01T09:00:02.000Z',
            lastErrorMessage: null,
          })),
        ),
      ),
    );

    renderWithProviders(<SyncMonitor institutionId={INSTITUTION} canRun />);

    expect(await screen.findByTestId('sync-freshness-summary')).toHaveTextContent(
      /Every domain has succeeded at least once/,
    );
    expect(screen.queryByText('Some domains are failing')).not.toBeInTheDocument();
  });

  it('breaks the latest run down by domain', async () => {
    renderWithProviders(<SyncMonitor institutionId={INSTITUTION} canRun />);

    expect(await screen.findByText('Latest run')).toBeInTheDocument();
    expect(screen.getAllByText('Courses').length).toBeGreaterThan(0);
    expect(await screen.findByText('60 fetched · 10 changed')).toBeInTheDocument();
    expect(screen.getAllByText('4 failed').length).toBeGreaterThan(0);
  });

  it('announces a run in flight and blocks starting a second one', async () => {
    server.use(
      http.get(RUNS_URL, () =>
        HttpResponse.json([{ ...syncRuns[0]!, status: 'running' }, syncRuns[1]!]),
      ),
    );

    renderWithProviders(<SyncMonitor institutionId={INSTITUTION} canRun />);

    expect(await screen.findByTestId('sync-active-notice')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run synchronization' })).toBeDisabled();
  });

  it('explains an institution that has never synchronized', async () => {
    server.use(
      http.get(RUNS_URL, () => HttpResponse.json([])),
      http.get(STATE_URL, () => HttpResponse.json([])),
    );

    renderWithProviders(<SyncMonitor institutionId={INSTITUTION} canRun />);

    expect(
      await screen.findByText('No domain has been synchronized yet.'),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText('No synchronization run has been recorded yet.').length,
    ).toBeGreaterThan(0);
  });

  it('reports a failure instead of an empty monitor', async () => {
    server.use(
      http.get(RUNS_URL, () =>
        HttpResponse.json(errorResponse(500, 'Boom', 'Internal Server Error'), {
          status: 500,
        }),
      ),
    );

    renderWithProviders(<SyncMonitor institutionId={INSTITUTION} canRun />);

    expect(
      await screen.findByText('Synchronization could not be loaded'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Run history')).not.toBeInTheDocument();
  });

  it('tells a reader without sync:run why there is no button', async () => {
    renderWithProviders(<SyncMonitor institutionId={INSTITUTION} canRun={false} />);

    expect(
      await screen.findByText('You may read synchronization here, but not start a run.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Run synchronization' }),
    ).not.toBeInTheDocument();
  });
});
