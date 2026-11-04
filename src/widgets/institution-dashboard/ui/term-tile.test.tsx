import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { errorResponse, renderWithProviders, screen, server } from '@/shared/test';

import { TermTile } from './term-tile';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const TERMS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/academic-terms`;
const EARLY_WINTER = new Date('2026-10-04T09:00:00.000Z');

describe('TermTile', () => {
  it('names the running term, how far in it is and what comes next', async () => {
    renderWithProviders(
      <TermTile institutionId={INSTITUTION} canManageTerms now={EARLY_WINTER} />,
    );

    expect(await screen.findByText('Winter semester 2026/2027')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-term-week')).toHaveTextContent('Week 2 of 21');
    expect(
      screen.getByRole('progressbar', { name: 'Share of the term gone' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Next: Summer semester 2026\/2027/)).toBeInTheDocument();
  });

  it('says whether enrolment is open and until when', async () => {
    renderWithProviders(
      <TermTile institutionId={INSTITUTION} canManageTerms={false} now={EARLY_WINTER} />,
    );

    expect(await screen.findByText('Open')).toBeInTheDocument();
    expect(screen.getByText(/^until /)).toBeInTheDocument();
  });

  it('looks ahead to the next term between terms', async () => {
    renderWithProviders(
      <TermTile
        institutionId={INSTITUTION}
        canManageTerms={false}
        now={new Date('2026-08-01T09:00:00.000Z')}
      />,
    );

    expect(await screen.findByText('Starts next.')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('offers the catalogue only to whoever may manage terms', async () => {
    const { unmount } = renderWithProviders(
      <TermTile institutionId={INSTITUTION} canManageTerms now={EARLY_WINTER} />,
    );

    expect(await screen.findByRole('link', { name: 'Manage terms' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/structure?tab=terms`,
    );
    unmount();

    renderWithProviders(
      <TermTile institutionId={INSTITUTION} canManageTerms={false} now={EARLY_WINTER} />,
    );

    expect(await screen.findByText('Winter semester 2026/2027')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Manage terms' })).not.toBeInTheDocument();
  });

  it('says when no term is on the books', async () => {
    server.use(http.get(TERMS_URL, () => HttpResponse.json([])));

    renderWithProviders(
      <TermTile institutionId={INSTITUTION} canManageTerms now={EARLY_WINTER} />,
    );

    expect(
      await screen.findByText(/No current or upcoming term is on the books/),
    ).toBeInTheDocument();
  });

  it('reports a failed read rather than an empty tile', async () => {
    server.use(
      http.get(TERMS_URL, () =>
        HttpResponse.json(errorResponse(500, 'Boom', 'Internal Server Error'), {
          status: 500,
        }),
      ),
    );

    renderWithProviders(
      <TermTile institutionId={INSTITUTION} canManageTerms now={EARLY_WINTER} />,
    );

    expect(
      await screen.findByText('The academic terms are unavailable right now.'),
    ).toBeInTheDocument();
  });
});
