import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen, server } from '@/shared/test';

import { ConnectorStatus } from './connector-status';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const CONNECTORS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/connectors`;

describe('ConnectorStatus', () => {
  it('names the connector behind each kind and says it answers', async () => {
    renderWithProviders(<ConnectorStatus institutionId={INSTITUTION} />);

    expect(await screen.findByText('Student information system')).toBeInTheDocument();
    expect(screen.getByText(/mock-sis/)).toBeInTheDocument();
    expect(screen.getByText('Reachable')).toBeInTheDocument();
  });

  it('marks a kind with no connector as not connected', async () => {
    renderWithProviders(<ConnectorStatus institutionId={INSTITUTION} />);

    expect(await screen.findByText('Learning management system')).toBeInTheDocument();
    expect(screen.getAllByText('Not connected').length).toBeGreaterThan(0);
  });

  it('reports a configured connector that cannot be reached, with the reason', async () => {
    server.use(
      http.get(CONNECTORS_URL, () =>
        HttpResponse.json([
          {
            kind: 'academic',
            name: 'ais2',
            installed: false,
            healthy: false,
            checkedAt: null,
            detail: 'No connector named "ais2" is installed',
            capabilities: [],
            alternatives: ['mock-sis'],
          },
        ]),
      ),
    );

    renderWithProviders(<ConnectorStatus institutionId={INSTITUTION} />);

    expect(await screen.findByText('Unreachable')).toBeInTheDocument();
    expect(
      screen.getByText('No connector named "ais2" is installed'),
    ).toBeInTheDocument();
  });

  it('explains a failure to load rather than rendering an empty list', async () => {
    server.use(http.get(CONNECTORS_URL, () => new HttpResponse(null, { status: 500 })));

    renderWithProviders(<ConnectorStatus institutionId={INSTITUTION} />);

    expect(
      await screen.findByText('Connector status could not be loaded'),
    ).toBeInTheDocument();
  });
});
