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

import { ProgramMembers } from './program-members';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const PROGRAM = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1';
const BASE = `/api/proxy/api/v1/institutions/${INSTITUTION}`;
const MEMBERS = `${BASE}/programs/${PROGRAM}/members`;

const render = () =>
  renderWithProviders(<ProgramMembers institutionId={INSTITUTION} programId={PROGRAM} />);

const actingAs = (roles: string[], granted: string[]) => {
  server.use(
    http.get(`${BASE}/me/permissions`, () =>
      HttpResponse.json({ ...permissions, roles, permissions: granted }),
    ),
  );
};

const readOnly = () => {
  actingAs(['registrar'], ['institution:read', 'program:read', 'role:read']);
};

async function choosePerson() {
  const picker = await screen.findByLabelText('Person');

  await userEvent.click(picker);
  await userEvent.click(await screen.findByRole('option', { name: /Jana Nováková/u }));
}

describe('ProgramMembers', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('counts only the people actually studying', async () => {
    render();

    expect(await screen.findByText('1 studying now')).toBeInTheDocument();
  });

  it('puts those studying above those who have left', async () => {
    render();

    const table = await screen.findByTestId('program-members-table');
    const names = within(table)
      .getAllByRole('row')
      .slice(1)
      .map(row => row.textContent);

    expect(names[0]).toContain('Jana Nováková');
    expect(names[1]).toContain('Peter Kováč');
  });

  it('admits somebody to the programme', async () => {
    render();
    await choosePerson();
    await userEvent.click(screen.getByRole('button', { name: 'Admit' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'They are now a student of this programme.',
      );
    });
  });

  it('puts a refused admission on the person field', async () => {
    server.use(
      http.post(MEMBERS, () =>
        HttpResponse.json(
          errorResponse(409, 'That person is already on this programme', 'Conflict'),
          { status: 409 },
        ),
      ),
    );

    render();
    await choosePerson();
    await userEvent.click(screen.getByRole('button', { name: 'Admit' }));

    expect(
      await screen.findByText('That person is already on this programme'),
    ).toBeInTheDocument();
  });

  it('changes a standing, which is what takes the student role away', async () => {
    render();

    await userEvent.selectOptions(
      await screen.findByLabelText('Standing of Jana Nováková'),
      'graduated',
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Jana Nováková is now Graduated.');
    });
  });

  it('shows the roll as badges, with no controls, to a reader', async () => {
    readOnly();
    render();

    expect(await screen.findByText('Studying')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Admit' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Standing of Jana Nováková')).not.toBeInTheDocument();
  });

  it('keeps the roll from a student, without even asking for it', async () => {
    const asked = vi.fn();
    server.use(
      http.get(MEMBERS, () => {
        asked();
        return HttpResponse.json([]);
      }),
    );
    actingAs(['student'], ['institution:read', 'program:read']);

    const { container } = render();

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
    expect(screen.queryByText('Jana Nováková')).not.toBeInTheDocument();
    expect(asked).not.toHaveBeenCalled();
  });

  it('says so when nobody is on the programme', async () => {
    server.use(http.get(MEMBERS, () => HttpResponse.json([])));

    render();

    expect(
      await screen.findByText('Nobody is on this programme yet.'),
    ).toBeInTheDocument();
  });
});
