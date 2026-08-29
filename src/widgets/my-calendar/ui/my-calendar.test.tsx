import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  errorResponse,
  renderWithProviders,
  screen,
  server,
  userEvent,
} from '@/shared/test';

import { MyCalendar } from './my-calendar';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const EVENTS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/timetable-events`;
const WEDNESDAY = new Date(2026, 2, 4);

const renderCalendar = () =>
  renderWithProviders(<MyCalendar institutionId={INSTITUTION} today={WEDNESDAY} />);

describe('MyCalendar', () => {
  it('opens on the week containing today', async () => {
    renderCalendar();

    expect(await screen.findByTestId('calendar-week')).toHaveTextContent('Mar 2');
    expect(screen.getByTestId('calendar-week')).toHaveTextContent('Mar 8');
  });

  it('lists each day that has events, with the events on it', async () => {
    renderCalendar();

    expect(
      await screen.findByRole('heading', { name: /Monday, March 2/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Wednesday, March 4/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Algorithms' })).toBeInTheDocument();
  });

  it('falls back to the course title when the import carried none', async () => {
    renderCalendar();

    expect(
      await screen.findByRole('heading', { name: 'Algorithms' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Algorithms seminar' }),
    ).toBeInTheDocument();
  });

  it('marks a cancelled event and one the reader teaches', async () => {
    renderCalendar();

    expect(await screen.findByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('You teach this')).toBeInTheDocument();
  });

  it('names the room, or says none was recorded', async () => {
    renderCalendar();

    expect(await screen.findByText('Room P1, Jesenná 5')).toBeInTheDocument();
    expect(screen.getByText('No room recorded')).toBeInTheDocument();
  });

  it('links an event to the course it belongs to', async () => {
    renderCalendar();

    expect(await screen.findByRole('link', { name: 'Algorithms' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/courses/aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1`,
    );
  });

  it('asks the server for the next week when the reader moves forward', async () => {
    const ranges: string[] = [];
    server.use(
      http.get(EVENTS_URL, ({ request }) => {
        ranges.push(new URL(request.url, location.origin).searchParams.get('from') ?? '');

        return HttpResponse.json([]);
      }),
    );

    renderCalendar();
    await userEvent.click(await screen.findByRole('button', { name: 'Next week' }));

    expect(await screen.findByTestId('calendar-week')).toHaveTextContent('Mar 9');
    expect(ranges.at(-1)).toBe(new Date(2026, 2, 9).toISOString());
  });

  it('returns to the current week from wherever the reader wandered', async () => {
    renderCalendar();

    await userEvent.click(await screen.findByRole('button', { name: 'Previous week' }));
    expect(await screen.findByTestId('calendar-week')).toHaveTextContent('Feb 23');

    await userEvent.click(screen.getByRole('button', { name: 'This week' }));
    expect(await screen.findByTestId('calendar-week')).toHaveTextContent('Mar 2');
  });

  it('explains an empty week instead of showing a bare heading', async () => {
    server.use(http.get(EVENTS_URL, () => HttpResponse.json([])));

    renderCalendar();

    expect(
      await screen.findByText('Nothing is scheduled for this week.'),
    ).toBeInTheDocument();
  });

  it('reports a failed read rather than an empty week', async () => {
    server.use(
      http.get(EVENTS_URL, () =>
        HttpResponse.json(errorResponse(500, 'Boom', 'Internal Server Error'), {
          status: 500,
        }),
      ),
    );

    renderCalendar();

    expect(
      await screen.findByText('The calendar could not be loaded'),
    ).toBeInTheDocument();
  });
});
