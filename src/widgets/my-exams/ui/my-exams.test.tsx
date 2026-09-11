import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  errorResponse,
  examTerms as examTermFixtures,
  renderWithProviders,
  screen,
  server,
  userEvent,
} from '@/shared/test';

import { MyExams } from './my-exams';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const EXAMS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/exam-terms`;
const MAY = new Date(2026, 4, 20);

const renderExams = () =>
  renderWithProviders(<MyExams institutionId={INSTITUTION} now={MAY} />);

describe('MyExams', () => {
  it('separates the exams still to come from the ones already sat', async () => {
    renderExams();

    expect(
      await screen.findByRole('heading', { name: 'Upcoming', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Past', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('2 exam terms ahead of you')).toBeInTheDocument();
  });

  it('names the kind, room and examiner of an exam term', async () => {
    renderExams();

    expect((await screen.findAllByText('Regular')).length).toBe(2);
    expect(screen.getByText('Room P1, Jesenná 5')).toBeInTheDocument();
    expect(screen.getByText('Examiner: Alan Turing')).toBeInTheDocument();
  });

  it('admits when no room or examiner was imported', async () => {
    renderExams();

    expect((await screen.findAllByText('No room recorded')).length).toBe(2);
    expect(screen.getAllByText('No examiner recorded').length).toBe(2);
  });

  it('shows the seats left, and says full instead of none left', async () => {
    renderExams();

    expect(await screen.findByText('18 of 30 seats free')).toBeInTheDocument();
    expect(screen.getByText('Full')).toBeInTheDocument();
    expect(screen.getByText('No seat limit recorded')).toBeInTheDocument();
  });

  it('tells the reader where they already hold a place', async () => {
    renderExams();

    expect(await screen.findByText('You are registered')).toBeInTheDocument();
  });

  it('reports the registration window in the reader’s terms', async () => {
    renderExams();

    expect(await screen.findByText(/Registration closes/)).toBeInTheDocument();
    expect(screen.getByText(/Registration opens/)).toBeInTheDocument();
    expect(screen.getByText('Registration is closed')).toBeInTheDocument();
  });

  it('marks a cancelled exam and one the reader examines', async () => {
    renderExams();

    expect(await screen.findByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('You examine this')).toBeInTheDocument();
  });

  it('links an exam to the course it belongs to', async () => {
    renderExams();

    const [link] = await screen.findAllByRole('link', { name: 'Algorithms' });

    expect(link).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/courses/aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1`,
    );
  });

  it('explains an empty list instead of showing bare headings', async () => {
    server.use(http.get(EXAMS_URL, () => HttpResponse.json([])));

    renderExams();

    expect(
      await screen.findByText('No exam terms have been imported for your courses.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Upcoming' })).not.toBeInTheDocument();
  });

  it('reports a failed read rather than an empty list', async () => {
    server.use(
      http.get(EXAMS_URL, () =>
        HttpResponse.json(errorResponse(500, 'Boom', 'Internal Server Error'), {
          status: 500,
        }),
      ),
    );

    renderExams();

    expect(await screen.findByText('The exams could not be loaded')).toBeInTheDocument();
  });

  it('dates an exam with its year, so a term a year out is not read as past', async () => {
    renderExams();

    expect(await screen.findByText(/June 2, 2026/)).toBeInTheDocument();
  });

  it('asks the server for one course when the reader picks it', async () => {
    const chosen: (string | null)[] = [];
    server.events.on('request:start', ({ request }) => {
      const url = new URL(request.url, location.origin);

      if (url.pathname.endsWith('/me/exam-terms'))
        chosen.push(url.searchParams.get('offeringId'));
    });

    renderExams();
    await userEvent.click(await screen.findByRole('combobox', { name: 'Course' }));
    await userEvent.click(await screen.findByRole('option', { name: /INF\/DB\/22/ }));

    expect(
      await screen.findByRole('heading', { name: 'Databases', level: 3 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Algorithms' })).not.toBeInTheDocument();
    expect(chosen).toContain('aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2');
  });

  it('asks the server for one kind when the reader picks it', async () => {
    renderExams();

    await userEvent.click(await screen.findByRole('combobox', { name: 'Kind' }));
    await userEvent.click(await screen.findByRole('option', { name: 'First retake' }));

    await screen.findByText('1 exam term ahead of you');
    expect(screen.queryByText('Room P1, Jesenná 5')).not.toBeInTheDocument();
  });

  it('narrows to the terms the server says the reader may act on', async () => {
    renderExams();

    await screen.findByTestId('my-exams');
    await userEvent.click(screen.getByRole('switch', { name: 'Only what I can act on' }));

    const upcoming = await screen.findByRole('heading', { name: 'Upcoming', level: 2 });

    expect(upcoming).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Past', level: 2 }),
    ).not.toBeInTheDocument();
  });

  it('says a filter emptied the list rather than that nothing was imported', async () => {
    server.use(http.get(EXAMS_URL, () => HttpResponse.json([])));

    renderExams();

    expect(
      await screen.findByText('No exam terms have been imported for your courses.'),
    ).toBeInTheDocument();
  });

  it('explains why a seat is out of reach when the window alone does not', async () => {
    server.use(
      http.get(EXAMS_URL, () =>
        HttpResponse.json([
          {
            ...examTermFixtures[0],
            registrationAvailability: {
              canRegister: false,
              canCancel: false,
              reason: 'other_term_registered',
            },
          },
        ]),
      ),
    );

    renderExams();

    expect(
      await screen.findByText(
        'You are registered for another term of this course. Cancel that one first.',
      ),
    ).toBeInTheDocument();
  });
});
