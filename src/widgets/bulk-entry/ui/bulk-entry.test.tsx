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

import { BulkEntry } from './bulk-entry';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const BASE = `/api/proxy/api/v1/institutions/${INSTITUTION}`;

const render = () => renderWithProviders(<BulkEntry institutionId={INSTITUTION} />);

const paste = async (text: string) => {
  await userEvent.type(await screen.findByLabelText('The data'), text);
};

describe('BulkEntry', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('will not let anything be applied before it has been previewed', async () => {
    render();
    await paste('courseCode,termCode');

    expect(screen.getByRole('button', { name: /Apply/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeEnabled();
  });

  it('previews row by row, saying what would happen to each', async () => {
    render();
    await paste('courseCode,termCode');
    await userEvent.click(screen.getByRole('button', { name: 'Preview' }));

    const rows = await screen.findByTestId('bulk-rows');

    expect(within(rows).getByText('INF/ALG/22 will run in 2026W')).toBeInTheDocument();
    expect(within(rows).getByText('No course has the code NOPE')).toBeInTheDocument();
    expect(screen.getByText('Nothing written')).toBeInTheDocument();
    expect(
      screen.getByText('2 rows · 1 to create · 0 already there · 1 refused'),
    ).toBeInTheDocument();
  });

  it('offers to apply only the rows that would succeed', async () => {
    render();
    await paste('courseCode,termCode');
    await userEvent.click(screen.getByRole('button', { name: 'Preview' }));

    expect(await screen.findByRole('button', { name: 'Apply 1 row' })).toBeEnabled();
  });

  it('writes when applied, and says how many', async () => {
    render();
    await paste('courseCode,termCode');
    await userEvent.click(screen.getByRole('button', { name: 'Preview' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Apply 1 row' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('1 row was written.');
    });
  });

  it('forgets the preview the moment the text changes', async () => {
    render();
    await paste('courseCode,termCode');
    await userEvent.click(screen.getByRole('button', { name: 'Preview' }));
    await screen.findByTestId('bulk-rows');

    await paste('\nmore');

    expect(screen.queryByTestId('bulk-rows')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apply/ })).toBeDisabled();
  });

  it('surfaces a refused paste rather than a half-import', async () => {
    server.use(
      http.post(`${BASE}/bulk/course-offerings`, () =>
        HttpResponse.json(
          errorResponse(
            400,
            'The first row must name these columns: courseCode, termCode',
            'Bad Request',
          ),
          { status: 400 },
        ),
      ),
    );

    render();
    await paste('nonsense');
    await userEvent.click(screen.getByRole('button', { name: 'Preview' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'The first row must name these columns: courseCode, termCode',
      );
    });
    expect(screen.queryByTestId('bulk-rows')).not.toBeInTheDocument();
  });

  it('says which columns the chosen kind needs, and changes them with the kind', async () => {
    render();

    expect(
      await screen.findByText('Columns: courseCode,termCode,capacity,language'),
    ).toBeInTheDocument();

    await userEvent.selectOptions(
      screen.getByLabelText('What are you importing?'),
      'members',
    );

    expect(screen.getByText('Columns: email,programCode,studyYear')).toBeInTheDocument();
  });

  it('refuses the half the caller may not do', async () => {
    server.use(
      http.get(`${BASE}/me/permissions`, () =>
        HttpResponse.json({
          ...permissions,
          roles: ['registrar'],
          permissions: ['institution:read', 'program:manage'],
        }),
      ),
    );

    render();
    await paste('courseCode,termCode');

    expect(await screen.findByText('You cannot import here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeDisabled();
  });
});
