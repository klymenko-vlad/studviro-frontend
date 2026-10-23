import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  LEARNING_SECTION_ID,
  learningMaterials,
  learningSections,
  offeringAssignments,
  renderWithProviders,
  screen,
  server,
  uploadTicket,
  waitFor,
  within,
} from '@/shared/test';

import { OfferingOutline } from './offering-outline';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const SPACE = '9a1f0b3c-1111-4111-8111-111111111111';
const SPACE_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/learning-spaces/${SPACE}`;
const MATERIALS_URL = `${SPACE_URL}/materials`;
const SECTIONS_URL = `${SPACE_URL}/sections`;

const render = (viewerRole: 'student' | 'teacher' | 'administrator' = 'administrator') =>
  renderWithProviders(
    <OfferingOutline
      institutionId={INSTITUTION}
      offeringId={OFFERING}
      spaceId={SPACE}
      viewerRole={viewerRole}
    />,
  );

const itemTitles = (region: HTMLElement) =>
  within(region)
    .getAllByRole('listitem')
    .map(item => item.textContent);

function recordBodies(method: 'post' | 'patch', url: string, answer: object) {
  const bodies: unknown[] = [];

  server.use(
    http[method](url, async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json(answer, { status: method === 'post' ? 201 : 200 });
    }),
  );

  return bodies;
}

const pdf = () => new File(['%PDF-1.7'], 'lecture-02.pdf', { type: 'application/pdf' });

describe('OfferingOutline', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('lays the page out as the general area, then each section in order', async () => {
    render('student');

    const general = await screen.findByRole('region', { name: 'General' });
    const week = screen.getByRole('region', { name: 'Week 1 — sorting' });

    expect(itemTitles(general)).toEqual([
      expect.stringContaining('The course repository'),
      expect.stringContaining('How marking works'),
    ]);
    expect(itemTitles(week)).toEqual([
      expect.stringContaining('Lecture 1 — slides'),
      expect.stringContaining('Assignment 1 — sorting'),
    ]);
    expect(within(week).getByText(learningSections[0]!.summary!)).toBeInTheDocument();
  });

  it('links an assignment to its place on the Assignments tab', async () => {
    render('student');

    const link = await screen.findByRole('link', { name: 'Assignment 1 — sorting' });

    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining(
        `?section=assignments#activity-${offeringAssignments[0]!.id}`,
      ),
    );
  });

  it('gives a reader no authoring controls', async () => {
    render('student');

    await screen.findByRole('region', { name: 'Week 1 — sorting' });

    expect(screen.queryByRole('form', { name: 'Add a section' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^Add material/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Move Lecture 1 — slides up' }),
    ).not.toBeInTheDocument();
  });

  it('marks a hidden section for its teacher', async () => {
    server.use(
      http.get(SECTIONS_URL, () =>
        HttpResponse.json([{ ...learningSections[0]!, visible: false }]),
      ),
    );

    render('teacher');

    const week = await screen.findByRole('region', { name: 'Week 1 — sorting' });

    expect(within(week).getByText('Hidden')).toBeInTheDocument();
    expect(
      within(week).getByRole('button', { name: 'Show Week 1 — sorting' }),
    ).toBeInTheDocument();
  });

  it('adds a section from the form at the bottom', async () => {
    const bodies = recordBodies('post', SECTIONS_URL, learningSections[0]!);
    const { user } = render('teacher');

    const form = await screen.findByRole('form', { name: 'Add a section' });
    await user.type(within(form).getByRole('textbox', { name: 'Title' }), '  Week 2 ');
    await user.click(within(form).getByRole('button', { name: 'Add a section' }));

    await waitFor(() => {
      expect(bodies).toEqual([{ title: 'Week 2', summary: null }]);
    });
    expect(toast.success).toHaveBeenCalledWith('Section added');
  });

  it('refuses a section without a title', async () => {
    const bodies = recordBodies('post', SECTIONS_URL, learningSections[0]!);
    const { user } = render('teacher');

    const form = await screen.findByRole('form', { name: 'Add a section' });
    await user.click(within(form).getByRole('button', { name: 'Add a section' }));

    expect(
      await within(form).findByText(/./, { selector: '[data-slot="form-message"]' }),
    ).toBeInTheDocument();
    expect(bodies).toEqual([]);
  });

  it('hides a section and everything in it with one action', async () => {
    const bodies = recordBodies(
      'patch',
      `${SECTIONS_URL}/:sectionId`,
      learningSections[0]!,
    );
    const { user } = render('teacher');

    await user.click(
      await screen.findByRole('button', {
        name: 'Hide Week 1 — sorting and everything in it',
      }),
    );

    await waitFor(() => {
      expect(bodies).toEqual([{ visible: false }]);
    });
  });

  it('moves an item to another section from its section picker', async () => {
    const bodies = recordBodies(
      'patch',
      `${MATERIALS_URL}/:materialId`,
      learningMaterials[2]!,
    );
    const { user } = render('teacher');

    await user.selectOptions(
      await screen.findByRole('combobox', { name: 'Section for How marking works' }),
      LEARNING_SECTION_ID,
    );

    await waitFor(() => {
      expect(bodies).toEqual([{ sectionId: LEARNING_SECTION_ID }]);
    });
  });

  it('swaps an item with the one above it, across kinds', async () => {
    const seen: string[] = [];
    server.use(
      http.patch(`${MATERIALS_URL}/:materialId`, async ({ params, request }) => {
        seen.push(
          `material ${String(params['materialId'])} ${JSON.stringify(await request.json())}`,
        );
        return HttpResponse.json(learningMaterials[0]);
      }),
      http.patch(`${SPACE_URL}/assignments/:assignmentId`, async ({ request }) => {
        seen.push(`assignment ${JSON.stringify(await request.json())}`);
        return HttpResponse.json(offeringAssignments[0]);
      }),
    );
    const { user } = render('teacher');

    await user.click(
      await screen.findByRole('button', { name: 'Move Assignment 1 — sorting up' }),
    );

    await waitFor(() => {
      expect(seen).toEqual([
        'assignment {"position":0}',
        `material ${learningMaterials[0]!.id} {"position":1}`,
      ]);
    });
  });

  it('adds a material straight into the section it was asked for in', async () => {
    const seen: string[] = [];
    let body: unknown;

    server.use(
      http.post(`${MATERIALS_URL}/upload-tickets`, () => {
        seen.push('ticket');
        return HttpResponse.json(uploadTicket, { status: 201 });
      }),
      http.put(uploadTicket.url, () => {
        seen.push('put');
        return new HttpResponse(null, { status: 200 });
      }),
      http.post(MATERIALS_URL, async ({ request }) => {
        seen.push('confirm');
        body = await request.json();
        return HttpResponse.json(learningMaterials[0], { status: 201 });
      }),
    );

    const { user } = render('teacher');

    await user.click(
      await screen.findByRole('button', { name: 'Add material to Week 1 — sorting' }),
    );
    const form = await screen.findByRole('form', { name: 'Add a material' });
    await user.type(within(form).getByRole('textbox', { name: 'Title' }), 'Lecture 2');
    await user.upload(within(form).getByLabelText('File'), pdf());
    await user.click(within(form).getByRole('button', { name: 'Add the material' }));

    await waitFor(() => {
      expect(seen).toEqual(['ticket', 'put', 'confirm']);
    });
    expect(body).toMatchObject({ title: 'Lecture 2', sectionId: LEARNING_SECTION_ID });
    await waitFor(() => {
      expect(
        screen.queryByRole('form', { name: 'Add a material' }),
      ).not.toBeInTheDocument();
    });
  });

  it('refuses to add anything when the upload itself fails', async () => {
    let creates = 0;
    server.use(
      http.put(uploadTicket.url, () => new HttpResponse(null, { status: 500 })),
      http.post(MATERIALS_URL, () => {
        creates += 1;
        return HttpResponse.json(learningMaterials[0], { status: 201 });
      }),
    );

    const { user } = render('teacher');

    await user.click(
      await screen.findByRole('button', { name: 'Add material to General' }),
    );
    const form = await screen.findByRole('form', { name: 'Add a material' });
    await user.type(within(form).getByRole('textbox', { name: 'Title' }), 'Lecture 2');
    await user.upload(within(form).getByLabelText('File'), pdf());
    await user.click(within(form).getByRole('button', { name: 'Add the material' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'The file could not be uploaded. Nothing was added.',
      );
    });
    expect(creates).toBe(0);
  });

  it('reports a server failure rather than an empty page', async () => {
    server.use(http.get(SECTIONS_URL, () => new HttpResponse(null, { status: 500 })));

    render();

    expect(
      await screen.findByText(
        'The course content could not be loaded. Try again in a moment.',
      ),
    ).toBeInTheDocument();
  });

  it('says so when a reader opens a course page with nothing on it', async () => {
    server.use(
      http.get(SECTIONS_URL, () => HttpResponse.json([])),
      http.get(MATERIALS_URL, () => HttpResponse.json([])),
      http.get(`${SPACE_URL}/assignments`, () => HttpResponse.json([])),
    );

    render('student');

    expect(
      await screen.findByText('Nothing has been put on this course page yet.'),
    ).toBeInTheDocument();
  });
});
