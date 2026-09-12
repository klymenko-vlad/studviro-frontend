import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders, screen, server, userEvent, waitFor } from '@/shared/test';

import { ConnectorCredentialsCard } from './connector-credentials-card';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const CREDENTIALS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/connectors/academic/credentials`;

describe('ConnectorCredentialsCard', () => {
  it('lists each declared field with its configured state', async () => {
    renderWithProviders(
      <ConnectorCredentialsCard institutionId={INSTITUTION} kind="academic" />,
    );

    expect(await screen.findByText('mock-sis')).toBeInTheDocument();
    expect(screen.getByLabelText('API key')).toBeInTheDocument();
    expect(screen.getByLabelText('Base URL')).toBeInTheDocument();
    expect(screen.getByText('Configured')).toBeInTheDocument();
    expect(screen.getByText('Not set')).toBeInTheDocument();
    expect(screen.getByText('Incomplete')).toBeInTheDocument();
  });

  it('shows when a connector needs no credentials', async () => {
    server.use(
      http.get(CREDENTIALS_URL, () =>
        HttpResponse.json({
          kind: 'academic',
          connectorName: 'mock-sis',
          complete: true,
          fields: [],
        }),
      ),
    );

    renderWithProviders(
      <ConnectorCredentialsCard institutionId={INSTITUTION} kind="academic" />,
    );

    expect(
      await screen.findByText('This connector needs no credentials.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('saves a new value for a field', async () => {
    const saved = vi.fn();
    let baseUrlConfigured = false;

    const buildResponse = () => ({
      kind: 'academic' as const,
      connectorName: 'mock-sis',
      complete: baseUrlConfigured,
      fields: [
        {
          key: 'apiKey',
          label: 'API key',
          description: 'The API key issued by the student information system.',
          secret: true,
          required: true,
          configured: true,
          updatedAt: '2026-08-20T10:00:00.000Z',
        },
        {
          key: 'baseUrl',
          label: 'Base URL',
          description: null,
          secret: false,
          required: true,
          configured: baseUrlConfigured,
          updatedAt: baseUrlConfigured ? '2026-09-12T00:00:00.000Z' : null,
        },
      ],
    });

    server.use(
      http.get(CREDENTIALS_URL, () => HttpResponse.json(buildResponse())),
      http.put(CREDENTIALS_URL, async ({ request }) => {
        const body = (await request.json()) as { values: Record<string, string> };
        saved(body);
        baseUrlConfigured = true;

        return HttpResponse.json(buildResponse());
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <ConnectorCredentialsCard institutionId={INSTITUTION} kind="academic" />,
    );

    const input = await screen.findByLabelText('Base URL');
    await user.type(input, 'https://sis.example.edu');
    await user.click(screen.getAllByRole('button', { name: 'Save' })[1]!);

    await waitFor(() => {
      expect(saved).toHaveBeenCalledWith({
        values: { baseUrl: 'https://sis.example.edu' },
      });
    });
    expect(await screen.findByText('Complete')).toBeInTheDocument();
    expect(await screen.findByLabelText('Base URL')).toHaveValue('');
  });

  it('clears a configured field', async () => {
    const cleared = vi.fn();
    let apiKeyConfigured = true;

    const buildResponse = () => ({
      kind: 'academic' as const,
      connectorName: 'mock-sis',
      complete: apiKeyConfigured,
      fields: [
        {
          key: 'apiKey',
          label: 'API key',
          description: 'The API key issued by the student information system.',
          secret: true,
          required: true,
          configured: apiKeyConfigured,
          updatedAt: apiKeyConfigured ? '2026-08-20T10:00:00.000Z' : null,
        },
        {
          key: 'baseUrl',
          label: 'Base URL',
          description: null,
          secret: false,
          required: true,
          configured: false,
          updatedAt: null,
        },
      ],
    });

    server.use(
      http.get(CREDENTIALS_URL, () => HttpResponse.json(buildResponse())),
      http.delete(`${CREDENTIALS_URL}/:fieldKey`, ({ params }) => {
        cleared(params['fieldKey']);
        apiKeyConfigured = false;

        return HttpResponse.json(buildResponse());
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <ConnectorCredentialsCard institutionId={INSTITUTION} kind="academic" />,
    );

    await screen.findByLabelText('API key');
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    await waitFor(() => {
      expect(cleared).toHaveBeenCalledWith('apiKey');
    });
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('rejects saving an empty value', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ConnectorCredentialsCard institutionId={INSTITUTION} kind="academic" />,
    );

    await screen.findByLabelText('Base URL');
    await user.click(screen.getAllByRole('button', { name: 'Save' })[1]!);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Enter a value before saving.',
    );
  });

  it('explains a failure to load', async () => {
    server.use(http.get(CREDENTIALS_URL, () => new HttpResponse(null, { status: 500 })));

    renderWithProviders(
      <ConnectorCredentialsCard institutionId={INSTITUTION} kind="academic" />,
    );

    await waitFor(() => {
      expect(screen.getByText('Credentials could not be loaded')).toBeInTheDocument();
    });
  });
});
