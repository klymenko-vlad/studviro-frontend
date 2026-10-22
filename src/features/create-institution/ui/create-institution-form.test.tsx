import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import {
  errorResponse,
  renderWithProviders,
  screen,
  server,
  waitFor,
} from '@/shared/test';

import { CreateInstitutionForm } from './create-institution-form';

const API = '/api/proxy/api/v1';
const ADMIN = '11111111-1111-4111-8111-111111111111';

const push = vi.fn();

vi.mock('@/shared/config', async importOriginal => ({
  ...(await importOriginal<typeof SharedConfig>()),
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

async function fillValidForm(user: ReturnType<typeof renderWithProviders>['user']) {
  await user.type(screen.getByLabelText('Institution code'), 'upjs');
  await user.type(screen.getByLabelText('Institution name'), 'UPJŠ');
  await user.type(screen.getByLabelText('First administrator'), ADMIN);
}

describe('CreateInstitutionForm', () => {
  it('labels every input so it is reachable by name', () => {
    renderWithProviders(<CreateInstitutionForm />);

    expect(screen.getByLabelText('Institution code')).toBeInTheDocument();
    expect(screen.getByLabelText('Institution name')).toBeInTheDocument();
    expect(screen.getByLabelText('First administrator')).toBeInTheDocument();
  });

  it('blocks submission and announces an error for a malformed code', async () => {
    const { user } = renderWithProviders(<CreateInstitutionForm />);

    await user.type(screen.getByLabelText('Institution code'), 'Not A Code');
    await user.click(screen.getByRole('button', { name: 'Create institution' }));

    expect(await screen.findAllByRole('alert')).not.toHaveLength(0);
    expect(screen.getByLabelText('Institution code')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('creates the institution and navigates to its dashboard', async () => {
    server.use(
      http.post(`${API}/institutions`, () =>
        HttpResponse.json(
          {
            id: '22222222-2222-4222-8222-222222222222',
            code: 'upjs',
            name: 'UPJŠ',
            defaultLocale: 'en',
            timezone: 'Europe/Bratislava',
          },
          { status: 201 },
        ),
      ),
    );

    const { user } = renderWithProviders(<CreateInstitutionForm />);
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create institution' }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith(
        '/institutions/22222222-2222-4222-8222-222222222222',
      );
    });
  });

  it('surfaces a duplicate code on the code field rather than in a toast', async () => {
    server.use(
      http.post(`${API}/institutions`, () =>
        HttpResponse.json(
          errorResponse(409, 'An institution with this code already exists', 'Conflict'),
          { status: 409 },
        ),
      ),
    );

    const { user } = renderWithProviders(<CreateInstitutionForm />);
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create institution' }));

    expect(
      await screen.findByText('An institution with this code already exists'),
    ).toBeInTheDocument();
  });

  it('surfaces an unknown administrator on that field', async () => {
    server.use(
      http.post(`${API}/institutions`, () =>
        HttpResponse.json(errorResponse(404, 'user not found', 'Not Found'), {
          status: 404,
        }),
      ),
    );

    const { user } = renderWithProviders(<CreateInstitutionForm />);
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create institution' }));

    expect(await screen.findByText('user not found')).toBeInTheDocument();
  });
});
