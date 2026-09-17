import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

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

  it('lists every discrepancy even when none of them carries an identifier', async () => {
    const nameless = (detail: string) => ({
      kind: 'conflict' as const,
      externalId: null,
      canonicalId: null,
      detail,
      sourceUpdatedAt: null,
      platformUpdatedAt: null,
    });
    server.use(
      http.get(URL, () =>
        HttpResponse.json({
          ...reconciliationReport,
          discrepancyCount: 2,
          domains: [
            {
              ...reconciliationReport.domains[0],
              discrepancyCount: 2,
              discrepancies: [
                nameless('The first orphan'),
                nameless('The second orphan'),
              ],
            },
          ],
        }),
      ),
    );
    // React only warns about a duplicate key, so the rows alone prove nothing.
    const complaints = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderWithProviders(<SyncReconciliation institutionId={INSTITUTION} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Check for discrepancies' }),
    );

    expect(await screen.findByText('The first orphan')).toBeInTheDocument();
    expect(screen.getByText('The second orphan')).toBeInTheDocument();
    const duplicateKey = complaints.mock.calls.some(([first]) =>
      String(first).includes('same key'),
    );
    complaints.mockRestore();
    expect(duplicateKey).toBe(false);
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

  it('offers both decisions on a discrepancy that names a canonical row', async () => {
    renderWithProviders(<SyncReconciliation institutionId={INSTITUTION} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Check for discrepancies' }),
    );

    expect(
      await screen.findByRole('button', { name: 'Accept the source' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep ours' })).toBeInTheDocument();
  });

  it('offers no decision on a record the platform never took in', async () => {
    renderWithProviders(<SyncReconciliation institutionId={INSTITUTION} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Check for discrepancies' }),
    );

    expect(
      await screen.findByText(
        'Run a full Student information system synchronization to take this record in.',
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Accept the source' })).toHaveLength(1);
  });

  it('shows what has already been resolved, without being asked to compare', async () => {
    renderWithProviders(<SyncReconciliation institutionId={INSTITUTION} />);

    expect(await screen.findByText('Resolved discrepancies')).toBeInTheDocument();
    expect(await screen.findByText('Keep ours')).toBeInTheDocument();
    expect(screen.getByText('course-77')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Resolved' })).toBeInTheDocument();
  });

  it('says so plainly when nobody has resolved anything', async () => {
    server.use(http.get(`${URL}/resolutions`, () => HttpResponse.json([])));

    renderWithProviders(<SyncReconciliation institutionId={INSTITUTION} />);

    expect(
      await screen.findByText('Nobody has resolved a discrepancy yet.'),
    ).toBeInTheDocument();
  });

  it('does not pretend the log is empty when it could not be read', async () => {
    server.use(
      http.get(`${URL}/resolutions`, () => HttpResponse.json(null, { status: 500 })),
    );

    renderWithProviders(<SyncReconciliation institutionId={INSTITUTION} />);

    expect(
      await screen.findByText('The resolution log could not be read just now.'),
    ).toBeInTheDocument();
  });

  it('compares the learning half when the system picker names it', async () => {
    renderWithProviders(<SyncReconciliation institutionId={INSTITUTION} />);

    await userEvent.selectOptions(
      screen.getByLabelText('System'),
      'Learning management system',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Check for discrepancies' }),
    );

    expect(await screen.findAllByText('Learning spaces')).not.toHaveLength(0);
    expect(screen.getByText('space-3')).toBeInTheDocument();
    expect(screen.queryByText('course-404')).not.toBeInTheDocument();
  });

  it('names the system the two sides disagreed about', async () => {
    renderWithProviders(<SyncReconciliation institutionId={INSTITUTION} />);

    await userEvent.selectOptions(
      screen.getByLabelText('System'),
      'Learning management system',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Check for discrepancies' }),
    );

    expect(
      await screen.findByText(/differ between the Learning management system/),
    ).toBeInTheDocument();
  });

  it('says people are compared by neither system', () => {
    renderWithProviders(<SyncReconciliation institutionId={INSTITUTION} />);

    expect(screen.getByText(/People are compared by neither system/)).toBeInTheDocument();
  });
});
