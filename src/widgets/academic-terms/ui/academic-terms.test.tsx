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
  within,
} from '@/shared/test';

import { AcademicTerms } from './academic-terms';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const BASE = `/api/proxy/api/v1/institutions/${INSTITUTION}`;

const render = () => renderWithProviders(<AcademicTerms institutionId={INSTITUTION} />);

const readOnly = () => {
  server.use(
    http.get(`${BASE}/me/permissions`, () =>
      HttpResponse.json({
        ...permissions,
        roles: ['student'],
        permissions: permissions.permissions.filter(p => p !== 'institution:manage'),
      }),
    ),
  );
};

async function fillValidTerm() {
  await userEvent.type(await screen.findByLabelText('Code'), '2027W');
  await userEvent.type(screen.getByLabelText('Name'), 'Winter semester 2027/2028');
  await userEvent.type(screen.getByLabelText('Academic year'), '2027/2028');
  await userEvent.type(screen.getByLabelText('Starts'), '2027-09-20');
  await userEvent.type(screen.getByLabelText('Ends'), '2028-02-13');
}

describe('AcademicTerms', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('lists the terms the institution runs', async () => {
    render();

    expect(await screen.findByText('Winter semester 2026/2027')).toBeInTheDocument();
    expect(screen.getByText('Summer semester 2026/2027')).toBeInTheDocument();
    expect(screen.getByText('2026W')).toBeInTheDocument();
  });

  it('says which terms self-service enrolment can never open on', async () => {
    render();

    const table = await screen.findByTestId('academic-terms-table');
    const summer = within(table).getByText('Summer semester 2026/2027').closest('tr');

    expect(within(summer!).getByText('Never opens')).toBeInTheDocument();
  });

  it('creates a term and reports it', async () => {
    render();
    await fillValidTerm();
    await userEvent.click(screen.getByRole('button', { name: 'Add term' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Winter semester 2026/2027 was added.');
    });
  });

  it('refuses to submit a term that ends before it starts', async () => {
    let posted = false;
    server.use(
      http.post(`${BASE}/academic-terms`, () => {
        posted = true;
        return HttpResponse.json({}, { status: 201 });
      }),
    );

    render();
    await userEvent.type(await screen.findByLabelText('Code'), '2027W');
    await userEvent.type(screen.getByLabelText('Name'), 'Backwards');
    await userEvent.type(screen.getByLabelText('Academic year'), '2027/2028');
    await userEvent.type(screen.getByLabelText('Starts'), '2028-02-13');
    await userEvent.type(screen.getByLabelText('Ends'), '2027-09-20');
    await userEvent.click(screen.getByRole('button', { name: 'Add term' }));

    expect(
      await screen.findByText('A term must end after it starts'),
    ).toBeInTheDocument();
    expect(posted).toBe(false);
  });

  it('puts a duplicate code on the code field rather than in a toast', async () => {
    server.use(
      http.post(`${BASE}/academic-terms`, () =>
        HttpResponse.json(
          errorResponse(409, 'Another academic term already has that code', 'Conflict'),
          { status: 409 },
        ),
      ),
    );

    render();
    await fillValidTerm();
    await userEvent.click(screen.getByRole('button', { name: 'Add term' }));

    expect(
      await screen.findByText('Another academic term already has that code'),
    ).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('explains why a term with offerings cannot be retired', async () => {
    server.use(
      http.delete(`${BASE}/academic-terms/:id`, () =>
        HttpResponse.json(
          errorResponse(
            409,
            'This term still has course offerings; retire those first',
            'Conflict',
          ),
          { status: 409 },
        ),
      ),
    );

    render();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Retire Winter semester 2026/2027' }),
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'This term still has course offerings; retire those first',
      );
    });
  });

  it('shows the calendar but no way to change it without institution:manage', async () => {
    readOnly();
    render();

    expect(await screen.findByText('Winter semester 2026/2027')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add term' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Retire/ })).not.toBeInTheDocument();
  });
});
