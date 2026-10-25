import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import {
  errorResponse,
  examTerms as examTermFixtures,
  renderWithProviders,
  screen,
  server,
  userEvent,
  within,
} from '@/shared/test';

import { MyCalendar } from './my-calendar';

const search = vi.hoisted(() => ({ value: new URLSearchParams('view=list') }));
const replace = vi.hoisted(() => vi.fn());

vi.mock('@/shared/config', async importOriginal => ({
  ...(await importOriginal<typeof SharedConfig>()),
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/institutions/x/calendar',
  useSearchParams: () => search.value,
}));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const EVENTS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/timetable-events`;
const EXAMS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/exam-terms`;
const DEADLINES_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/deadlines`;
const WEDNESDAY = new Date(2026, 2, 4);

const renderCalendar = () =>
  renderWithProviders(<MyCalendar institutionId={INSTITUTION} today={WEDNESDAY} />);

describe('MyCalendar', () => {
  beforeEach(() => {
    search.value = new URLSearchParams('view=list');
    replace.mockReset();
  });

  it('draws the week as a grid with each class at its time', async () => {
    search.value = new URLSearchParams('view=week');
    renderCalendar();

    const grid = await screen.findByTestId('calendar-grid');
    expect(await within(grid).findAllByRole('link')).not.toHaveLength(0);
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  it('switches between the grid and the list, and remembers it in the address', async () => {
    search.value = new URLSearchParams('view=week');
    renderCalendar();

    expect(await screen.findByRole('button', { name: 'Week' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: 'List' }));

    expect(replace).toHaveBeenLastCalledWith('/institutions/x/calendar?view=list', {
      scroll: false,
    });
  });

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

  it('offers a way back to this week only once the reader has left it', async () => {
    renderCalendar();

    expect(await screen.findByRole('button', { name: 'This week' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Next week' }));
    expect(screen.getByRole('button', { name: 'This week' })).toBeEnabled();
  });

  it('explains an empty week instead of showing a bare heading', async () => {
    server.use(
      http.get(EVENTS_URL, () => HttpResponse.json([])),
      http.get(DEADLINES_URL, () => HttpResponse.json([])),
    );

    renderCalendar();

    expect(
      await screen.findByText('Nothing is scheduled for this week.'),
    ).toBeInTheDocument();
  });

  it('says "this week" only of the week containing today', async () => {
    renderCalendar();

    expect(await screen.findByText(/events? this week$/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Next week' }));

    expect(await screen.findByTestId('calendar-week')).toHaveTextContent('Mar 9');
    expect(screen.queryByText(/this week/)).not.toBeInTheDocument();
  });

  it('names the dates of an empty week other than this one', async () => {
    server.use(
      http.get(EVENTS_URL, () => HttpResponse.json([])),
      http.get(DEADLINES_URL, () => HttpResponse.json([])),
    );

    renderCalendar();
    await userEvent.click(await screen.findByRole('button', { name: 'Next week' }));

    expect(
      await screen.findByText('Nothing is scheduled for Mar 9 – Mar 15.'),
    ).toBeInTheDocument();
    expect(screen.getByText('0 events')).toBeInTheDocument();
  });

  it('shows an exam term of the week beside the classes, as its own layer', async () => {
    server.use(http.get(EXAMS_URL, () => HttpResponse.json([examTermFixtures[0]])));

    renderCalendar();

    expect(await screen.findByTestId('calendar-exam')).toBeInTheDocument();
    expect(screen.getByText('Exam term')).toBeInTheDocument();
    expect(screen.getByText('18 of 30 seats free')).toBeInTheDocument();
  });

  it('drops the exam layer when the reader turns it off', async () => {
    server.use(http.get(EXAMS_URL, () => HttpResponse.json([examTermFixtures[0]])));

    renderCalendar();
    await screen.findByTestId('calendar-exam');
    await userEvent.click(screen.getByRole('switch', { name: 'Show exam terms' }));

    expect(screen.queryByTestId('calendar-exam')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Algorithms' })).toBeInTheDocument();
  });

  it('shows an assignment deadline of the week as its own layer', async () => {
    renderCalendar();

    expect(await screen.findByTestId('calendar-deadline')).toBeInTheDocument();
    expect(screen.getByText('Deadline')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Assignment 1' })).toBeInTheDocument();
  });

  it('links a deadline to its assignment and an exam to its term', async () => {
    server.use(http.get(EXAMS_URL, () => HttpResponse.json([examTermFixtures[0]])));

    renderCalendar();

    const deadline = await screen.findByTestId('calendar-deadline');
    const exam = await screen.findByTestId('calendar-exam');

    expect(within(deadline).getByRole('link').getAttribute('href')).toMatch(
      /\?section=assignments#activity-[\w-]+$/,
    );
    expect(within(exam).getByRole('link').getAttribute('href')).toMatch(
      new RegExp(`\\?section=schedule#exam-term-${examTermFixtures[0]!.id}$`),
    );
  });

  it('drops the deadline layer when the reader turns it off', async () => {
    renderCalendar();
    await screen.findByTestId('calendar-deadline');
    await userEvent.click(screen.getByRole('switch', { name: 'Show deadlines' }));

    expect(screen.queryByTestId('calendar-deadline')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Algorithms' })).toBeInTheDocument();
  });

  it('asks the server for one type when the reader picks it', async () => {
    const chosen: (string | null)[] = [];
    server.events.on('request:start', ({ request }) => {
      const url = new URL(request.url, location.origin);

      if (url.pathname.endsWith('/me/timetable-events'))
        chosen.push(url.searchParams.get('type'));
    });

    renderCalendar();
    await userEvent.selectOptions(
      await screen.findByRole('combobox', { name: 'Type' }),
      await screen.findByRole('option', { name: 'Seminar' }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Algorithms seminar' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Algorithms' })).not.toBeInTheDocument();
    expect(chosen).toContain('seminar');
  });

  it('asks the server for one course when the reader picks it', async () => {
    const chosen: (string | null)[] = [];
    server.events.on('request:start', ({ request }) => {
      const url = new URL(request.url, location.origin);

      if (url.pathname.endsWith('/me/timetable-events'))
        chosen.push(url.searchParams.get('offeringId'));
    });

    renderCalendar();
    await userEvent.selectOptions(
      await screen.findByRole('combobox', { name: 'Course' }),
      await screen.findByRole('option', { name: /INF\/ALG\/22/ }),
    );

    await screen.findByRole('heading', { name: 'Algorithms' });
    expect(chosen).toContain('aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1');
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
