import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  PERSONAL_TASK_ID,
  personalTasks,
  renderWithProviders,
  screen,
  server,
  userEvent,
  waitFor,
  within,
} from '@/shared/test';

import { MyTasks } from './my-tasks';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const TASKS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/tasks`;
const NOW = new Date('2026-06-01T08:00:00.000Z');

const renderTasks = () =>
  renderWithProviders(<MyTasks institutionId={INSTITUTION} now={NOW} />);

describe('MyTasks', () => {
  it('lists the person’s open tasks with their due time', async () => {
    renderTasks();

    const list = await screen.findByRole('list', { name: 'Tasks' });
    expect(within(list).getByText('Pay the dorm fee')).toBeInTheDocument();
    expect(within(list).getByText('Return library books')).toBeInTheDocument();
    expect(within(list).getByText('No due time')).toBeInTheDocument();
  });

  it('sends the text filter and the state to the server', async () => {
    const asked: URLSearchParams[] = [];
    server.use(
      http.get(TASKS_URL, ({ request }) => {
        asked.push(new URL(request.url).searchParams);
        return HttpResponse.json({
          items: [],
          meta: { limit: 20, hasNextPage: false, nextCursor: null },
        });
      }),
    );
    renderTasks();

    await userEvent.selectOptions(await screen.findByLabelText('Show'), 'done');
    await userEvent.type(screen.getByLabelText('Search tasks'), 'rent');

    await waitFor(() => {
      expect(asked.at(-1)?.get('q')).toBe('rent');
    });
    expect(asked.at(-1)?.get('status')).toBe('done');
    expect(await screen.findByText('No task matches “rent”.')).toBeInTheDocument();
  });

  it('loads the next page on request', async () => {
    server.use(
      http.get(TASKS_URL, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');
        return HttpResponse.json(
          cursor === 'next'
            ? {
                items: [personalTasks[1]],
                meta: { limit: 20, hasNextPage: false, nextCursor: null },
              }
            : {
                items: [personalTasks[0]],
                meta: { limit: 20, hasNextPage: true, nextCursor: 'next' },
              },
        );
      }),
    );
    renderTasks();

    await userEvent.click(await screen.findByRole('button', { name: /Load more/ }));

    expect(await screen.findByText('Return library books')).toBeInTheDocument();
  });

  it('marks a task done', async () => {
    let body: unknown;
    server.use(
      http.patch(`${TASKS_URL}/${PERSONAL_TASK_ID}`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...personalTasks[0], done: true });
      }),
    );
    renderTasks();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Mark “Pay the dorm fee” as done' }),
    );

    await waitFor(() => {
      expect(body).toEqual({ done: true });
    });
  });

  it('deletes a task only after the person confirms', async () => {
    let deleted = false;
    server.use(
      http.delete(`${TASKS_URL}/${PERSONAL_TASK_ID}`, () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderTasks();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Edit “Pay the dorm fee”' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Edit task' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(deleted).toBe(false);
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Delete this task?');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Yes, delete' }));

    await waitFor(() => {
      expect(deleted).toBe(true);
    });
  });

  it('marks a task past its due time as overdue', async () => {
    renderWithProviders(
      <MyTasks institutionId={INSTITUTION} now={new Date('2026-06-10T08:00:00.000Z')} />,
    );

    expect(await screen.findByText('Overdue')).toBeInTheDocument();
  });
});
