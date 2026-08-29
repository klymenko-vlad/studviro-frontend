import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import {
  errorResponse,
  renderWithProviders,
  screen,
  server,
  syncRuns,
  waitFor,
} from '@/shared/test';

import { StartSyncRunButton } from './start-sync-run-button';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const RUNS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/synchronization/runs`;

describe('StartSyncRunButton', () => {
  it('queues an incremental run by default', async () => {
    const started = vi.fn();
    server.use(
      http.post(RUNS_URL, async ({ request }) => {
        started(await request.json());

        return HttpResponse.json(syncRuns[0], { status: 202 });
      }),
    );

    const { user } = renderWithProviders(
      <StartSyncRunButton institutionId={INSTITUTION} />,
    );

    await user.click(screen.getByRole('button', { name: 'Run synchronization' }));

    await waitFor(() => {
      expect(started).toHaveBeenCalledWith({ mode: 'incremental' });
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Synchronization run queued');
    });
  });

  it('queues a full run once that mode is chosen', async () => {
    const started = vi.fn();
    server.use(
      http.post(RUNS_URL, async ({ request }) => {
        started(await request.json());

        return HttpResponse.json(syncRuns[0], { status: 202 });
      }),
    );

    const { user } = renderWithProviders(
      <StartSyncRunButton institutionId={INSTITUTION} />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Mode' }));
    await user.click(screen.getByRole('option', { name: 'Full' }));
    await user.click(screen.getByRole('button', { name: 'Run synchronization' }));

    await waitFor(() => {
      expect(started).toHaveBeenCalledWith({ mode: 'full' });
    });
  });

  it('cannot be used while a run is already in flight', () => {
    const started = vi.fn();
    server.use(
      http.post(RUNS_URL, () => {
        started();

        return HttpResponse.json(syncRuns[0], { status: 202 });
      }),
    );

    renderWithProviders(<StartSyncRunButton institutionId={INSTITUTION} disabled />);

    expect(screen.getByRole('button', { name: 'Run synchronization' })).toBeDisabled();
    expect(started).not.toHaveBeenCalled();
  });

  it('surfaces a refused run rather than pretending it started', async () => {
    server.use(
      http.post(RUNS_URL, () =>
        HttpResponse.json(errorResponse(403, 'You may not start a run', 'Forbidden'), {
          status: 403,
        }),
      ),
    );

    const { user } = renderWithProviders(
      <StartSyncRunButton institutionId={INSTITUTION} />,
    );

    await user.click(screen.getByRole('button', { name: 'Run synchronization' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('You may not start a run');
    });
    expect(toast.success).not.toHaveBeenCalled();
  });
});
