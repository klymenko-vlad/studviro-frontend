import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  errorResponse,
  permissions,
  renderWithProviders,
  screen,
  server,
  userEvent,
  waitFor,
} from '@/shared/test';

import { PersonDirectoryTable } from './person-directory-table';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const BASE = `/api/proxy/api/v1/institutions/${INSTITUTION}`;

const render = () =>
  renderWithProviders(<PersonDirectoryTable institutionId={INSTITUTION} />);

const openFor = async (name: string) => {
  await userEvent.click(await screen.findByRole('button', { name: `Erase ${name}` }));
};

describe('erasing a person (O4)', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('will not erase until the operator types the address', async () => {
    render();
    await openFor('Jana Nováková');

    expect(screen.getByRole('button', { name: 'Erase this person' })).toBeDisabled();

    await userEvent.type(
      screen.getByLabelText('Type jana.novakova@example.com to confirm'),
      'jana.novakova@example.com',
    );

    expect(screen.getByRole('button', { name: 'Erase this person' })).toBeEnabled();
  });

  it('says what erasure keeps as well as what it destroys', async () => {
    render();
    await openFor('Jana Nováková');

    expect(
      screen.getByText(/Their academic record stays — the grades remain/),
    ).toBeInTheDocument();
  });

  it('erases once confirmed', async () => {
    render();
    await openFor('Jana Nováková');
    await userEvent.type(
      screen.getByLabelText('Type jana.novakova@example.com to confirm'),
      'jana.novakova@example.com',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Erase this person' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Jana Nováková was erased.');
    });
  });

  it('surfaces the refusal when another institution still knows them', async () => {
    server.use(
      http.delete(`${BASE}/people/:userId/personal-data`, () =>
        HttpResponse.json(
          errorResponse(
            409,
            'This person is still known to 1 other institution',
            'Conflict',
          ),
          { status: 409 },
        ),
      ),
    );

    render();
    await openFor('Jana Nováková');
    await userEvent.type(
      screen.getByLabelText('Type jana.novakova@example.com to confirm'),
      'jana.novakova@example.com',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Erase this person' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'This person is still known to 1 other institution',
      );
    });
  });

  it('offers nothing to erase without institution:manage', async () => {
    server.use(
      http.get(`${BASE}/me/permissions`, () =>
        HttpResponse.json({
          ...permissions,
          roles: ['registrar'],
          permissions: ['institution:read', 'role:read'],
        }),
      ),
    );

    render();
    await screen.findByText('Jana Nováková');

    expect(screen.queryByRole('button', { name: /^Erase / })).not.toBeInTheDocument();
  });
});
