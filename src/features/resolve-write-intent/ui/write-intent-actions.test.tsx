import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WriteIntent } from '@/entities/write-intent';
import {
  errorResponse,
  renderWithProviders,
  screen,
  server,
  userEvent,
  waitFor,
  writeIntents,
} from '@/shared/test';

import { WriteIntentActions } from './write-intent-actions';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const BASE = `/api/proxy/api/v1/institutions/${INSTITUTION}/synchronization/write-intents`;
const refused = writeIntents[0]!;

function render(intent: WriteIntent = refused) {
  return renderWithProviders(
    <WriteIntentActions institutionId={INSTITUTION} intent={intent} />,
  );
}

describe('WriteIntentActions', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('queues the write again when it is retried', async () => {
    render();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('The write is queued again.');
    });
  });

  it('says the two systems stay apart when the write is discarded', async () => {
    render();

    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'The write was discarded. The two systems stay in disagreement.',
      );
    });
  });

  it('surfaces the server’s refusal rather than claiming success', async () => {
    server.use(
      http.post(`${BASE}/:id/retry`, () =>
        HttpResponse.json(
          errorResponse(409, 'That write is being delivered right now', 'Conflict'),
          { status: 409 },
        ),
      ),
    );
    render();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('That write is being delivered right now');
    });
  });

  it('offers nothing while the write is actually being delivered', () => {
    render({ ...refused, state: 'in_flight' });

    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    expect(screen.getByText('Being delivered now.')).toBeInTheDocument();
  });
});
