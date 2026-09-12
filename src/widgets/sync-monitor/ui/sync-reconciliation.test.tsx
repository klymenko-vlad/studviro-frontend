import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  reconciliationReport,
  renderWithProviders,
  screen,
  server,
  userEvent,
  waitFor,
} from '@/shared/test';

import { SyncReconciliation } from './sync-reconciliation';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/synchronization/reconciliation`;

describe('SyncReconciliation', () => {
  it('compares nothing until it is asked to', () => {
    renderWithProviders(<SyncReconciliation institutionId={INSTITUTION} />);

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByText(/Compared at/)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Check for discrepancies' }),
    ).toBeInTheDocument();
  });

  it('names every domain it compared and how the two sides line up', async () => {
    renderWithProviders(<SyncReconciliation institutionId={INSTITUTION} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Check for discrepancies' }),
    );

    expect(await screen.findAllByRole('table')).not.toHaveLength(0);
    expect(screen.getByText('The two sides disagree')).toBeInTheDocument();
    expect(screen.getAllByText('Courses').length).toBeGreaterThan(0);
    expect(screen.getByText('course-404')).toBeInTheDocument();
    expect(screen.getByText('Missing here')).toBeInTheDocument();
    expect(screen.getByText('Out of date')).toBeInTheDocument();
  });

  it('says so plainly when the two sides agree', async () => {
    server.use(
      http.get(URL, () =>
        HttpResponse.json({
          ...reconciliationReport,
          discrepancyCount: 0,
          domains: reconciliationReport.domains.map(domain => ({
            ...domain,
            discrepancyCount: 0,
            discrepancies: [],
          })),
        }),
      ),
    );
    renderWithProviders(<SyncReconciliation institutionId={INSTITUTION} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Check for discrepancies' }),
    );

    expect(await screen.findByText('The two sides agree')).toBeInTheDocument();
  });

  it('says how many discrepancies it is holding back', async () => {
    server.use(
      http.get(URL, () =>
        HttpResponse.json({
          ...reconciliationReport,
          discrepancyCount: 40,
          domains: [
            {
              ...reconciliationReport.domains[0]!,
              discrepancyCount: 40,
              truncated: true,
            },
            reconciliationReport.domains[1]!,
          ],
        }),
      ),
    );
    renderWithProviders(<SyncReconciliation institutionId={INSTITUTION} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Check for discrepancies' }),
    );

    expect(
      await screen.findByText(
        'Showing 2 of 40. Run synchronization and compare again to see the rest.',
      ),
    ).toBeInTheDocument();
  });

  it('reports a comparison the source refused', async () => {
    server.use(http.get(URL, () => new HttpResponse(null, { status: 500 })));
    renderWithProviders(<SyncReconciliation institutionId={INSTITUTION} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Check for discrepancies' }),
    );

    await waitFor(() =>
      expect(screen.getByText('The comparison failed')).toBeInTheDocument(),
    );
  });
});
