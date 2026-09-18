import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  permissions,
  renderWithProviders,
  screen,
  server,
  userEvent,
  waitFor,
} from '@/shared/test';

import { Catalogue } from './catalogue';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const BASE = `/api/proxy/api/v1/institutions/${INSTITUTION}`;

const render = () => renderWithProviders(<Catalogue institutionId={INSTITUTION} />);

describe('Catalogue', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('lists the programmes and the courses the institution offers', async () => {
    render();

    expect(await screen.findByText('Informatics')).toBeInTheDocument();
    expect(screen.getByText('Algorithms')).toBeInTheDocument();
    expect(screen.getByText('INF-BC')).toBeInTheDocument();
  });

  it('adds a programme the institution enters itself', async () => {
    render();

    await userEvent.type((await screen.findAllByLabelText('Code'))[0]!, 'MAT-BC');
    await userEvent.type(screen.getByLabelText('Name'), 'Mathematics');
    await userEvent.click(screen.getByRole('button', { name: 'Add programme' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('The programme was added.');
    });
  });

  it('adds a course the same way', async () => {
    render();

    await userEvent.type(await screen.findByLabelText('Title'), 'Databases');
    await userEvent.type(screen.getAllByLabelText('Code')[1]!, 'INF/DB/22');
    await userEvent.click(screen.getByRole('button', { name: 'Add course' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('The course was added.');
    });
  });

  it('surfaces a refused code rather than claiming success', async () => {
    server.use(
      http.post(`${BASE}/programs`, () =>
        HttpResponse.json(
          {
            statusCode: 409,
            error: 'Conflict',
            message: 'Another programme already has that code',
            path: '/x',
            requestId: 'r',
            timestamp: '2026-01-01T00:00:00.000Z',
          },
          { status: 409 },
        ),
      ),
    );
    render();

    await userEvent.type((await screen.findAllByLabelText('Code'))[0]!, 'INF-BC');
    await userEvent.type(screen.getByLabelText('Name'), 'Duplicate');
    await userEvent.click(screen.getByRole('button', { name: 'Add programme' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Another programme already has that code');
    });
  });

  it('shows no add form to somebody who may only read the catalogue', async () => {
    server.use(
      http.get(`${BASE}/me/permissions`, () =>
        HttpResponse.json({
          ...permissions,
          permissions: ['course:read', 'program:read'],
        }),
      ),
    );
    render();

    await screen.findByText('Informatics');

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Add programme' }),
      ).not.toBeInTheDocument();
    });
  });

  it('says so plainly when the catalogue is empty', async () => {
    server.use(
      http.get(`${BASE}/programs`, () => HttpResponse.json([])),
      http.get(`${BASE}/courses`, () => HttpResponse.json([])),
    );
    render();

    expect(await screen.findByText('No programmes yet.')).toBeInTheDocument();
    expect(screen.getByText('No courses yet.')).toBeInTheDocument();
  });
});
