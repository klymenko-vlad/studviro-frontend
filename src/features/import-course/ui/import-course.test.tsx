import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type { CourseImportReportDto, ImportSourceDto } from '@/shared/api';
import { renderWithProviders, screen, server, waitFor, within } from '@/shared/test';

import { ImportCourse } from './import-course';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const SPACE = '9a1f0b3c-1111-4111-8111-111111111111';
const PAST = '9a1f0b3c-2222-4222-8222-222222222222';
const OTHER = '9a1f0b3c-3333-4333-8333-333333333333';
const URL_BASE = `/api/proxy/api/v1/institutions/${INSTITUTION}/learning-spaces/${SPACE}/import`;

const source = (spaceId: string, name: string, extra: Partial<ImportSourceDto> = {}) =>
  ({
    spaceId,
    name,
    published: true,
    courseCode: 'INF/ALG/22',
    courseTitle: 'Algorithms',
    termCode: '2025W',
    termName: 'Winter semester 2025/2026',
    termStartsAt: '2025-09-22T00:00:00.000Z',
    sameCourse: true,
    ...extra,
  }) satisfies ImportSourceDto;

const report = (extra: Partial<CourseImportReportDto> = {}): CourseImportReportDto => ({
  source: {
    spaceId: PAST,
    name: 'Algorithms (2025W)',
    termName: 'Winter semester 2025/2026',
  },
  imported: false,
  counts: {
    sections: 3,
    materials: 12,
    files: 2,
    assignments: 2,
    quizzes: 1,
    quizSlots: 6,
    questionCategories: 3,
    questions: 7,
  },
  dateShift: {
    applied: true,
    days: 364,
    sourceStartsAt: '2025-09-22T00:00:00.000Z',
    targetStartsAt: '2026-09-21T00:00:00.000Z',
  },
  shiftedDates: 11,
  remappedReferences: 4,
  visibility: 'hidden',
  flags: [
    {
      code: 'group_dropped',
      count: 22,
      titles: Array.from({ length: 20 }, (_, i) => `W${i}`),
    },
  ],
  ...extra,
});

function serve() {
  const queries: string[] = [];
  const previews: (string | null)[] = [];
  const bodies: unknown[] = [];
  server.use(
    http.get(`${URL_BASE}/sources`, ({ request }) => {
      const url = new URL(request.url);
      queries.push(url.search);
      const page = Number(url.searchParams.get('page') ?? '1');
      const q = url.searchParams.get('q');
      const items =
        q !== null
          ? [source(OTHER, 'Databases (2026W)', { sameCourse: false, published: false })]
          : page === 1
            ? [source(PAST, 'Algorithms (2025W)')]
            : [
                source(OTHER, 'Databases (2026W)', {
                  sameCourse: false,
                  published: false,
                }),
              ];

      return HttpResponse.json({
        items,
        meta: {
          page,
          limit: 10,
          total: 2,
          pageCount: 2,
          hasNextPage: q === null && page === 1,
          hasPreviousPage: page > 1,
        },
      });
    }),
    http.get(`${URL_BASE}/preview`, ({ request }) => {
      const visibility = new URL(request.url).searchParams.get('visibility');
      previews.push(visibility);

      return HttpResponse.json(
        report(visibility === 'source' ? { visibility: 'source' } : {}),
      );
    }),
    http.post(URL_BASE, async ({ request }) => {
      bodies.push(await request.json());

      return HttpResponse.json(report({ imported: true, visibility: 'source' }), {
        status: 201,
      });
    }),
  );

  return { queries, previews, bodies };
}

const render = (onClose = vi.fn()) =>
  renderWithProviders(
    <ImportCourse institutionId={INSTITUTION} spaceId={SPACE} onClose={onClose} />,
  );

describe('ImportCourse', () => {
  it('lists the courses to import from a page at a time, and filters them', async () => {
    const { queries } = serve();
    const user = userEvent.setup();
    render();

    const panel = screen.getByRole('region', { name: 'Import from another course' });
    expect(
      await within(panel).findByRole('button', { name: /Algorithms \(2025W\)/ }),
    ).toHaveTextContent('Same course');

    await user.click(within(panel).getByRole('button', { name: /Load more/ }));
    expect(
      await within(panel).findByRole('button', {
        name: /Databases \(2026W\).*Unpublished/,
      }),
    ).toBeInTheDocument();

    await user.type(within(panel).getByLabelText('Filter courses'), 'dbs');
    await waitFor(() => {
      expect(queries.some(query => query.includes('q=dbs'))).toBe(true);
    });
    await waitFor(() => {
      expect(
        within(panel).queryByRole('button', { name: /Algorithms \(2025W\)/ }),
      ).toBeNull();
    });
  });

  it('previews what is copied and the date shift, then imports and reports', async () => {
    const { previews, bodies } = serve();
    const user = userEvent.setup();
    render();

    await user.click(await screen.findByRole('button', { name: /Algorithms \(2025W\)/ }));

    const panel = screen.getByRole('region', { name: 'Import from Algorithms (2025W)' });
    expect(await within(panel).findByText('3 sections')).toBeInTheDocument();
    expect(within(panel).getByText('7 questions')).toBeInTheDocument();
    expect(within(panel).queryByText(/quiz slot/)).toBeNull();
    expect(
      within(panel).getByText(
        /Dates move 364 days later, the gap between the two terms’ starts\. 11 dates move\./,
      ),
    ).toBeInTheDocument();
    expect(
      within(panel).getByText('4 access rules point at the copies.'),
    ).toBeInTheDocument();
    expect(within(panel).getByText(/arrives hidden from students/)).toBeInTheDocument();
    expect(within(panel).getByText(/and 2 more/)).toBeInTheDocument();
    expect(previews).toEqual(['hidden']);

    await user.click(
      within(panel).getByRole('switch', { name: /Keep each section and item/ }),
    );
    expect(
      await within(panel).findByText(/keep the visibility they had/),
    ).toBeInTheDocument();
    expect(previews).toEqual(['hidden', 'source']);

    await user.click(within(panel).getByRole('button', { name: 'Import' }));

    expect(
      await screen.findByRole('region', { name: 'Imported from Algorithms (2025W)' }),
    ).toBeInTheDocument();
    expect(bodies).toEqual([{ from: PAST, visibility: 'source' }]);
    expect(screen.queryByRole('button', { name: 'Import' })).toBeNull();
  });

  it('says so when dates cannot move, and goes back to the list', async () => {
    serve();
    server.use(
      http.get(`${URL_BASE}/preview`, () =>
        HttpResponse.json(
          report({
            dateShift: {
              applied: false,
              days: 0,
              sourceStartsAt: null,
              targetStartsAt: null,
            },
            flags: [],
          }),
        ),
      ),
    );
    const user = userEvent.setup();
    render();

    await user.click(await screen.findByRole('button', { name: /Algorithms \(2025W\)/ }));

    expect(
      await screen.findByText(/Dates stay as they are: one of the two courses/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Choose another course' }));
    expect(await screen.findByLabelText('Filter courses')).toBeInTheDocument();
  });

  it('shows why a preview is refused and offers no import', async () => {
    serve();
    server.use(
      http.get(`${URL_BASE}/preview`, () =>
        HttpResponse.json(
          { statusCode: 403, code: 'LEARNING_AUTHORING_DENIED', message: 'Not yours' },
          { status: 403 },
        ),
      ),
    );
    const user = userEvent.setup();
    render();

    await user.click(await screen.findByRole('button', { name: /Algorithms \(2025W\)/ }));

    expect(await screen.findByText('Not yours')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled();
  });

  it('closes', async () => {
    serve();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(onClose);

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
