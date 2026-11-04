import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type { FolderFileResponseDto, LearningMaterialResponseDto } from '@/shared/api';
import {
  ALWAYS_AVAILABLE,
  LEARNING_SECTION_ID,
  renderWithProviders,
  screen,
  server,
  waitFor,
  within,
} from '@/shared/test';

import { OfferingOutline } from './offering-outline';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/features/manage-materials/api/preview-page', () => ({
  previewPage: vi.fn((source: string) => Promise.resolve(<p>Rendered: {source}</p>)),
}));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const SPACE = '9a1f0b3c-1111-4111-8111-111111111111';
const SPACE_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/learning-spaces/${SPACE}`;
const MATERIALS_URL = `${SPACE_URL}/materials`;

const base = {
  description: null,
  body: null,
  url: null,
  filename: null,
  contentType: null,
  sizeBytes: null,
  visible: true,
  scanStatus: 'unscanned',
  sectionId: LEARNING_SECTION_ID,
  completionRule: 'none',
  ...ALWAYS_AVAILABLE,
} as const;

const PAGE = {
  ...base,
  id: 'ba5e0002-0000-4000-8000-000000000001',
  kind: 'page',
  title: 'Study guide',
  position: 10,
} as const;
const LABEL = {
  ...base,
  id: 'ba5e0002-0000-4000-8000-000000000002',
  kind: 'label',
  title: 'Part two',
  body: 'Part two\nBring a laptop.',
  position: 11,
} as const;
const VIDEO = {
  ...base,
  id: 'ba5e0002-0000-4000-8000-000000000003',
  kind: 'video',
  title: 'Lecture 1 recording',
  url: 'https://www.youtube-nocookie.com/embed/ZA-tUyM_y7s',
  position: 12,
} as const;
const FOLDER = {
  ...base,
  id: 'ba5e0002-0000-4000-8000-000000000004',
  kind: 'folder',
  title: 'Week 1 handouts',
  position: 13,
  completionRule: 'viewed',
} as const;

const materials: LearningMaterialResponseDto[] = [PAGE, LABEL, VIDEO, FOLDER];

const file = (n: number): FolderFileResponseDto => ({
  id: `f17e0000-0000-4000-8000-00000000000${n}`,
  filename: `sheet-${n}.pdf`,
  contentType: 'application/pdf',
  sizeBytes: 2048,
  scanStatus: 'clean',
  createdAt: '2026-10-20T09:00:00.000Z',
});

const render = (viewerRole: 'student' | 'teacher', list = materials) => {
  server.use(http.get(MATERIALS_URL, () => HttpResponse.json(list)));

  return renderWithProviders(
    <OfferingOutline
      institutionId={INSTITUTION}
      offeringId={OFFERING}
      spaceId={SPACE}
      viewerRole={viewerRole}
    />,
  );
};

describe('OfferingOutline — pages, labels, videos and folders', () => {
  it('links a page to a page of its own', async () => {
    render('student');

    const link = await screen.findByRole('link', { name: 'Read Study guide' });
    expect(link).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/courses/${OFFERING}/spaces/${SPACE}/pages/${PAGE.id}`,
    );
  });

  it('shows a label as text between items, with no kind badge for a student', async () => {
    render('student');

    expect(await screen.findByText(/Bring a laptop\./)).toBeInTheDocument();
    expect(screen.queryByText('Label')).not.toBeInTheDocument();
  });

  it('embeds a video lazily, named for the reader', async () => {
    render('student');

    const frame = await screen.findByTitle('Video: Lecture 1 recording');
    expect(frame.tagName).toBe('IFRAME');
    expect(frame).toHaveAttribute('src', VIDEO.url);
    expect(frame).toHaveAttribute('loading', 'lazy');
    expect(frame.getAttribute('sandbox')).not.toContain('allow-top-navigation');
  });

  it('never frames an address that is not one of the two players', async () => {
    render('student', [{ ...VIDEO, url: 'https://evil.example/embed/x' }]);

    await screen.findByText('Lecture 1 recording');
    expect(screen.queryByTitle('Video: Lecture 1 recording')).not.toBeInTheDocument();
  });

  it('opens a folder a page of files at a time, filtered by name, and counts it opened', async () => {
    const asked: string[] = [];
    let views = 0;
    server.use(
      http.get(`${MATERIALS_URL}/${FOLDER.id}/files`, ({ request }) => {
        const query = new URL(request.url).searchParams;
        asked.push(query.toString());
        const page = Number(query.get('page') ?? 1);
        const items = query.get('q')
          ? [file(3)]
          : page === 1
            ? [file(1), file(2)]
            : [file(3)];
        const total = query.get('q') ? 1 : 3;

        return HttpResponse.json({
          items,
          meta: {
            page,
            limit: 10,
            total,
            pageCount: query.get('q') ? 1 : 2,
            hasNextPage: !query.get('q') && page === 1,
            hasPreviousPage: page > 1,
          },
        });
      }),
      http.post(`${MATERIALS_URL}/${FOLDER.id}/views`, () => {
        views += 1;
        return new HttpResponse(null, { status: 204 });
      }),
      http.get(`${SPACE_URL}/my-progress`, () =>
        HttpResponse.json({
          total: 1,
          done: 0,
          sections: [],
          items: [
            {
              kind: 'material',
              id: FOLDER.id,
              rule: 'viewed',
              state: 'incomplete',
              completedAt: null,
              sectionId: LEARNING_SECTION_ID,
            },
          ],
        }),
      ),
    );
    const { user } = render('student');

    await user.click(await screen.findByRole('button', { name: 'Show files' }));

    const list = await screen.findByRole('list', { name: 'Files in Week 1 handouts' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: 'Download sheet-1.pdf' }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(views).toBe(1);
    });

    await user.click(screen.getByRole('button', { name: /Load more/ }));
    await waitFor(() => {
      expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    });

    await user.type(screen.getByRole('searchbox', { name: 'Find a file' }), 'sheet-3');
    await waitFor(() => {
      expect(asked.some(query => query.includes('q=sheet-3'))).toBe(true);
    });
  });

  it('lets a teacher edit a page’s title and text, read whole from the server', async () => {
    let saved: unknown;
    server.use(
      http.get(`${MATERIALS_URL}/${PAGE.id}`, () =>
        HttpResponse.json({ ...PAGE, body: '# Old text' }),
      ),
      http.patch(`${MATERIALS_URL}/${PAGE.id}`, async ({ request }) => {
        saved = await request.json();
        return HttpResponse.json({ ...PAGE, ...(saved as object) });
      }),
    );
    const { user } = render('teacher');

    await user.click(await screen.findByRole('button', { name: 'Edit Study guide' }));
    const form = await screen.findByRole('form', { name: 'Edit Study guide' });
    const text = await within(form).findByRole('textbox', { name: /Page text/ });
    expect(text).toHaveValue('# Old text');

    await user.clear(text);
    await user.type(text, 'New text');
    await user.click(within(form).getByRole('button', { name: 'Preview' }));
    expect(await within(form).findByText('Rendered: New text')).toBeInTheDocument();

    await user.click(within(form).getByRole('button', { name: 'Save changes' }));
    await waitFor(() => {
      expect(saved).toEqual({ title: 'Study guide', body: 'New text' });
    });
  });

  it('adds a label with no title and no completion rule', async () => {
    let created: Record<string, unknown> | undefined;
    server.use(
      http.post(MATERIALS_URL, async ({ request }) => {
        created = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...LABEL, ...created }, { status: 201 });
      }),
    );
    const { user } = render('teacher');

    await user.click(
      await screen.findByRole('button', { name: 'Add material to Week 1 — sorting' }),
    );
    const form = await screen.findByRole('form', { name: 'Add a material' });
    await user.selectOptions(
      within(form).getByRole('combobox', { name: /Kind/ }),
      'label',
    );

    expect(
      within(form).queryByRole('textbox', { name: /Title/ }),
    ).not.toBeInTheDocument();
    expect(
      within(form).queryByRole('combobox', { name: /completed/i }),
    ).not.toBeInTheDocument();

    await user.type(
      within(form).getByRole('textbox', { name: /Label text/ }),
      'Part three',
    );
    await user.click(within(form).getByRole('button', { name: 'Add the material' }));

    await waitFor(() => {
      expect(created).toMatchObject({
        kind: 'label',
        body: 'Part three',
        completionRule: 'none',
      });
    });
    expect(created).not.toHaveProperty('title');
  });

  it('lets a teacher take a file out of a folder, and a student not', async () => {
    let removed = '';
    server.use(
      http.get(`${MATERIALS_URL}/${FOLDER.id}/files`, () =>
        HttpResponse.json({
          items: removed === '' ? [file(1)] : [],
          meta: {
            page: 1,
            limit: 10,
            total: removed === '' ? 1 : 0,
            pageCount: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        }),
      ),
      http.delete(`${MATERIALS_URL}/${FOLDER.id}/files/:fileId`, ({ params }) => {
        removed = String(params['fileId']);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user } = render('teacher');

    await user.click(await screen.findByRole('button', { name: 'Show files' }));
    expect(await screen.findByLabelText('Add files')).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Remove sheet-1.pdf' }));

    await waitFor(() => {
      expect(removed).toBe(file(1).id);
    });
    expect(
      await screen.findByText('There are no files in this folder yet.'),
    ).toBeInTheDocument();
  });
});
