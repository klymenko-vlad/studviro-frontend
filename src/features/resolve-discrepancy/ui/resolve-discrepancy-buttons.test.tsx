import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  reconciliationReport,
  renderWithProviders,
  screen,
  server,
  userEvent,
  waitFor,
} from '@/shared/test';

import { ResolveDiscrepancyButtons } from './resolve-discrepancy-buttons';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/synchronization/reconciliation/resolutions`;

const stale = reconciliationReport.domains[0]!.discrepancies[1]!;

function render(onResolved?: () => void) {
  return renderWithProviders(
    <ResolveDiscrepancyButtons
      institutionId={INSTITUTION}
      domain="courses"
      discrepancy={stale}
      onResolved={onResolved}
    />,
  );
}

describe('ResolveDiscrepancyButtons', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('offers both sides of the decision', () => {
    render();

    expect(screen.getByRole('button', { name: 'Accept the source' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep ours' })).toBeInTheDocument();
  });

  it('sends the discrepancy it was given when the source is accepted', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post(URL, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json(
          { ...resolution, action: 'accept_source', requiresFullSync: true },
          { status: 201 },
        );
      }),
    );

    render();
    await userEvent.click(screen.getByRole('button', { name: 'Accept the source' }));

    await waitFor(() => {
      expect(body).toEqual({
        domain: 'courses',
        kind: 'stale',
        action: 'accept_source',
        canonicalId: stale.canonicalId,
        externalId: stale.externalId,
      });
    });
  });

  it('says a full run is still needed when the server says so', async () => {
    render();
    await userEvent.click(screen.getByRole('button', { name: 'Accept the source' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Resolved. Run a full Student information system synchronization to apply it.',
      );
    });
  });

  it('reports plainly when keeping ours, which needs no run', async () => {
    render();
    await userEvent.click(screen.getByRole('button', { name: 'Keep ours' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Discrepancy resolved.');
    });
  });

  it('tells the caller once the discrepancy is settled', async () => {
    let resolved = 0;
    render(() => {
      resolved += 1;
    });

    await userEvent.click(screen.getByRole('button', { name: 'Keep ours' }));

    await waitFor(() => {
      expect(resolved).toBe(1);
    });
  });

  it('surfaces the server’s refusal rather than claiming success', async () => {
    server.use(
      http.post(URL, () =>
        HttpResponse.json(
          {
            statusCode: 400,
            code: 'RECONCILIATION_NOT_RESOLVABLE',
            message: 'There is nothing to resolve here.',
          },
          { status: 400 },
        ),
      ),
    );

    render();
    await userEvent.click(screen.getByRole('button', { name: 'Keep ours' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('There is nothing to resolve here.');
    });
    expect(toast.success).not.toHaveBeenCalled();
  });
});

const resolution = {
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  domain: 'courses',
  kind: 'stale',
  action: 'accept_source',
  connectorName: 'mock-sis',
  sourceSystem: 'sis',
  externalId: 'course-12',
  canonicalId: stale.canonicalId,
  detail: 'Accepted the source.',
  resolvedById: null,
  resolvedAt: '2026-06-01T10:00:00.000Z',
  requiresFullSync: true,
};
