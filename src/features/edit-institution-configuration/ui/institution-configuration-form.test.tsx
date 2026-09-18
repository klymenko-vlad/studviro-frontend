import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import {
  errorResponse,
  institutionConfiguration,
  renderWithProviders,
  screen,
  server,
  waitFor,
  within,
} from '@/shared/test';

import { InstitutionConfigurationForm } from './institution-configuration-form';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const CONFIGURATION_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/configuration`;

const render = () =>
  renderWithProviders(
    <InstitutionConfigurationForm
      institutionId={INSTITUTION}
      configuration={institutionConfiguration}
    />,
  );

describe('InstitutionConfigurationForm', () => {
  it('shows the stored override in its field and leaves the rest empty', () => {
    render();

    expect(screen.getByLabelText('Faculty')).toHaveValue('School');
    expect(screen.getByLabelText('Course')).toHaveValue('');
  });

  it('renders one switch per feature flag, reflecting what is enabled', () => {
    render();

    expect(screen.getByRole('switch', { name: 'Exam registration' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Fees' })).not.toBeChecked();
  });

  it('sends a changed label and leaves the untouched ones as they were', async () => {
    const saved = vi.fn();
    server.use(
      http.patch(CONFIGURATION_URL, async ({ request }) => {
        saved(await request.json());

        return HttpResponse.json(institutionConfiguration);
      }),
    );

    const { user } = render();

    await user.clear(screen.getByLabelText('Course'));
    await user.type(screen.getByLabelText('Course'), 'Module');
    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    await waitFor(() => {
      expect(saved).toHaveBeenCalled();
    });
    expect(saved.mock.calls[0]?.[0]).toMatchObject({
      terminology: { faculty: 'School', course: 'Module' },
    });
  });

  it('sends an emptied label as null so the platform wording comes back', async () => {
    const saved = vi.fn();
    server.use(
      http.patch(CONFIGURATION_URL, async ({ request }) => {
        saved(await request.json());

        return HttpResponse.json(institutionConfiguration);
      }),
    );

    const { user } = render();

    await user.clear(screen.getByLabelText('Faculty'));
    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    await waitFor(() => {
      expect(saved).toHaveBeenCalled();
    });
    expect(saved.mock.calls[0]?.[0]).toMatchObject({ terminology: { faculty: null } });
  });

  it('sends a toggled feature flag', async () => {
    const saved = vi.fn();
    server.use(
      http.patch(CONFIGURATION_URL, async ({ request }) => {
        saved(await request.json());

        return HttpResponse.json(institutionConfiguration);
      }),
    );

    const { user } = render();

    await user.click(screen.getByRole('switch', { name: 'Grades' }));
    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    await waitFor(() => {
      expect(saved).toHaveBeenCalled();
    });
    expect(saved.mock.calls[0]?.[0]).toMatchObject({ features: { grades: false } });
  });

  it('will not let an administrator flip a switch that gates nothing', async () => {
    render();

    expect(await screen.findByRole('switch', { name: 'Fees' })).toBeDisabled();
    expect(screen.getByTestId('feature-unavailable-fees')).toHaveTextContent(
      /would change nothing/i,
    );
  });

  it('leaves the switches that do gate something usable', async () => {
    render();

    expect(await screen.findByRole('switch', { name: 'Grades' })).toBeEnabled();
    expect(screen.queryByTestId('feature-unavailable-grades')).not.toBeInTheDocument();
  });

  it('offers only the connectors the deployment installed, plus none at all', async () => {
    render();

    const sis = screen.getByRole('combobox', {
      name: 'Student information system',
    });

    expect(
      await within(sis).findByRole('option', { name: 'mock-sis' }),
    ).toBeInTheDocument();
    expect(
      within(sis).getByRole('option', { name: 'Not connected' }),
    ).toBeInTheDocument();
  });

  it('surfaces a rejected time zone on its own field', async () => {
    server.use(
      http.patch(CONFIGURATION_URL, () =>
        HttpResponse.json(errorResponse(400, 'timezone must be a valid IANA name'), {
          status: 400,
        }),
      ),
    );

    const { user } = render();

    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    expect(
      await screen.findByText('timezone must be a valid IANA name'),
    ).toBeInTheDocument();
  });
});
