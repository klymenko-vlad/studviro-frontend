import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  learningMaterials,
  renderWithProviders,
  screen,
  server,
  uploadTicket,
  waitFor,
  within,
} from '@/shared/test';

import { OfferingMaterials } from './offering-materials';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const SPACE = '9a1f0b3c-1111-4111-8111-111111111111';
const MATERIALS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/learning-spaces/${SPACE}/materials`;

const render = (viewerRole: 'student' | 'teacher' | 'administrator' = 'administrator') =>
  renderWithProviders(
    <OfferingMaterials
      institutionId={INSTITUTION}
      spaceId={SPACE}
      viewerRole={viewerRole}
    />,
  );

/** Counts the confirm step, so a test can prove it never ran. */
function countCreates() {
  const calls = { total: 0 };

  server.use(
    http.post(MATERIALS_URL, () => {
      calls.total += 1;
      return HttpResponse.json(learningMaterials[0], { status: 201 });
    }),
  );

  return calls;
}

const pdf = () => new File(['%PDF-1.7'], 'lecture-02.pdf', { type: 'application/pdf' });

describe('OfferingMaterials', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('lists the materials in the order the author put them', async () => {
    render();

    const list = await screen.findByRole('list', { name: 'Materials' });
    const titles = within(list)
      .getAllByRole('listitem')
      .map(item => item.textContent);

    expect(titles[0]).toContain('Lecture 1 — slides');
    expect(titles[1]).toContain('The course repository');
    expect(titles[2]).toContain('How marking works');
  });

  it('marks a material students cannot see', async () => {
    render();

    expect(await screen.findByText('Hidden')).toBeInTheDocument();
  });

  it('keeps the authoring form and the per-material actions away from a reader', async () => {
    render('student');

    expect(await screen.findByText('Lecture 1 — slides')).toBeInTheDocument();
    expect(
      screen.queryByRole('form', { name: 'Add a material' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Remove Lecture 1 — slides' }),
    ).not.toBeInTheDocument();
  });

  it('gives the authoring form to the teacher of the course, not only an administrator', async () => {
    render('teacher');

    expect(
      await screen.findByRole('form', { name: 'Add a material' }),
    ).toBeInTheDocument();
  });

  it('uploads a file to the store and only then asks the API to record it', async () => {
    const seen: string[] = [];

    server.use(
      http.post(`${MATERIALS_URL}/upload-tickets`, () => {
        seen.push('ticket');
        return HttpResponse.json(uploadTicket, { status: 201 });
      }),
      http.put(uploadTicket.url, () => {
        seen.push('put');
        return new HttpResponse(null, { status: 200 });
      }),
      http.post(MATERIALS_URL, () => {
        seen.push('confirm');
        return HttpResponse.json(learningMaterials[0], { status: 201 });
      }),
    );

    const { user } = render();

    const form = await screen.findByRole('form', { name: 'Add a material' });

    await user.type(within(form).getByRole('textbox', { name: 'Title' }), 'Lecture 2');
    await user.upload(within(form).getByLabelText('File'), pdf());
    await user.click(within(form).getByRole('button', { name: 'Add the material' }));

    await waitFor(() => {
      expect(seen).toEqual(['ticket', 'put', 'confirm']);
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Material added');
    });
  });

  it('refuses to add anything when the upload itself fails', async () => {
    const creates = countCreates();

    server.use(http.put(uploadTicket.url, () => new HttpResponse(null, { status: 500 })));

    const { user } = render();

    const form = await screen.findByRole('form', { name: 'Add a material' });

    await user.type(within(form).getByRole('textbox', { name: 'Title' }), 'Lecture 2');
    await user.upload(within(form).getByLabelText('File'), pdf());
    await user.click(within(form).getByRole('button', { name: 'Add the material' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'The file could not be uploaded. Nothing was added.',
      );
    });
    expect(creates.total).toBe(0);
  });

  it('asks for a file before it asks the store for anything', async () => {
    const creates = countCreates();

    const { user } = render();

    const form = await screen.findByRole('form', { name: 'Add a material' });

    await user.type(within(form).getByRole('textbox', { name: 'Title' }), 'Lecture 2');
    await user.click(within(form).getByRole('button', { name: 'Add the material' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Choose a file first');
    expect(creates.total).toBe(0);
  });

  it('reports a server failure rather than an empty list', async () => {
    server.use(http.get(MATERIALS_URL, () => new HttpResponse(null, { status: 500 })));

    render();

    expect(
      await screen.findByText('Materials could not be loaded. Try again in a moment.'),
    ).toBeInTheDocument();
  });

  it('says so when a course page has no materials yet', async () => {
    server.use(http.get(MATERIALS_URL, () => HttpResponse.json([])));

    render();

    expect(await screen.findByText('No materials yet.')).toBeInTheDocument();
  });
});
