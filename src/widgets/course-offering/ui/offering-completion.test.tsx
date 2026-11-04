import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  completionReport,
  renderAndAudit,
  renderWithProviders,
  screen,
  server,
  userEvent,
  waitFor,
  within,
} from '@/shared/test';

import { OfferingCompletion } from './offering-completion';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const REPORT_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/learning-spaces/:spaceId/completions`;

const render = () =>
  renderWithProviders(
    <OfferingCompletion institutionId={INSTITUTION} offeringId={OFFERING} />,
  );

describe('OfferingCompletion', () => {
  it('shows each student against each tracked item', async () => {
    render();

    const table = await screen.findByRole('table', {
      name: 'Completion by student and item',
    });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map(header => header.textContent),
    ).toEqual([
      'Student',
      'Done',
      'How marking works',
      'Lecture 1 — slides',
      'Assignment 1 — sorting',
    ]);

    const ada = within(table).getByRole('row', { name: /Ada Lovelace/u });
    expect(
      within(ada)
        .getAllByRole('cell')
        .map(cell => cell.textContent),
    ).toEqual([
      expect.stringContaining('2 of 3'),
      expect.stringContaining('Done'),
      expect.stringContaining('Not done'),
      expect.stringContaining('Passed'),
    ]);

    const charles = within(table).getByRole('row', { name: /Charles Babbage/u });
    expect(within(charles).getByText('Below the pass mark')).toBeInTheDocument();
  });

  it('narrows the students on the server as the teacher types', async () => {
    const queries: (string | null)[] = [];
    server.use(
      http.get(REPORT_URL, ({ request }) => {
        queries.push(new URL(request.url).searchParams.get('q'));
        return HttpResponse.json(completionReport);
      }),
    );
    render();

    await userEvent.type(
      await screen.findByRole('searchbox', { name: 'Filter students' }),
      'ada',
    );

    await waitFor(() => {
      expect(queries).toContain('ada');
    });
  });

  it('loads the next page of students on request', async () => {
    const pages: (string | null)[] = [];
    server.use(
      http.get(REPORT_URL, ({ request }) => {
        const page = new URL(request.url).searchParams.get('page');
        pages.push(page);
        return HttpResponse.json({
          ...completionReport,
          items: page === '2' ? [] : completionReport.items,
          meta: {
            ...completionReport.meta,
            page: Number(page ?? 1),
            hasNextPage: page !== '2',
          },
        });
      }),
    );
    render();

    await userEvent.click(await screen.findByRole('button', { name: /load more/iu }));

    await waitFor(() => {
      expect(pages).toContain('2');
    });
  });

  it('says how to start when no item tracks completion', async () => {
    server.use(
      http.get(REPORT_URL, () => HttpResponse.json({ ...completionReport, columns: [] })),
    );
    render();

    expect(await screen.findByText(/No item tracks completion yet/u)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('reports a failure rather than an empty table', async () => {
    server.use(http.get(REPORT_URL, () => HttpResponse.json({}, { status: 500 })));
    render();

    expect(await screen.findByText('Completion could not be loaded')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    await renderAndAudit(
      <OfferingCompletion institutionId={INSTITUTION} offeringId={OFFERING} />,
      async () => {
        await screen.findByRole('table');
      },
    );
  });
});
