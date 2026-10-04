import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { errorResponse, renderWithProviders, screen, server } from '@/shared/test';

import { RecentActivityTile } from './recent-activity-tile';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const AUDIT_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/audit-events`;
const NOW = new Date('2026-09-18T12:00:00.000Z');

describe('RecentActivityTile', () => {
  it('lists the latest recorded changes with when they happened', async () => {
    renderWithProviders(<RecentActivityTile institutionId={INSTITUTION} now={NOW} />);

    expect(
      await screen.findByText('Published a grade for Algorithms'),
    ).toBeInTheDocument();
    expect(screen.getByText('Granted registrar')).toBeInTheDocument();
    expect(screen.getByText('3 hours ago')).toBeInTheDocument();
  });

  it('asks the server for the newest few only', async () => {
    let requested: URL | undefined;
    server.use(
      http.get(AUDIT_URL, ({ request }) => {
        requested = new URL(request.url);
        return HttpResponse.json({
          items: [],
          meta: { limit: 5, hasNextPage: false, nextCursor: null },
        });
      }),
    );

    renderWithProviders(<RecentActivityTile institutionId={INSTITUTION} now={NOW} />);

    expect(await screen.findByText('Nothing has been recorded yet.')).toBeInTheDocument();
    expect(requested?.searchParams.get('limit')).toBe('5');
    expect(requested?.searchParams.get('order')).toBe('desc');
  });

  it('links through to the full audit trail', async () => {
    renderWithProviders(<RecentActivityTile institutionId={INSTITUTION} now={NOW} />);

    expect(
      await screen.findByRole('link', { name: 'Open the audit trail' }),
    ).toHaveAttribute('href', `/institutions/${INSTITUTION}/audit`);
  });

  it('reports a failed read rather than an empty tile', async () => {
    server.use(
      http.get(AUDIT_URL, () =>
        HttpResponse.json(errorResponse(500, 'Boom', 'Internal Server Error'), {
          status: 500,
        }),
      ),
    );

    renderWithProviders(<RecentActivityTile institutionId={INSTITUTION} now={NOW} />);

    expect(
      await screen.findByText('Recent changes are unavailable right now.'),
    ).toBeInTheDocument();
  });
});
