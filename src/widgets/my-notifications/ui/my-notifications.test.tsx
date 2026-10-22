import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  notifications,
  renderWithProviders,
  screen,
  server,
  waitFor,
} from '@/shared/test';

import { MyNotifications } from './my-notifications';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const NOTIFICATIONS_URL = `/api/proxy/api/v1/institutions/:institutionId/me/notifications`;

const renderWidget = () =>
  renderWithProviders(<MyNotifications institutionId={INSTITUTION} />);

describe('MyNotifications', () => {
  it('lists what changed, newest first, with the course that changed', async () => {
    renderWidget();

    expect(await screen.findByText('Exam term moved')).toBeInTheDocument();
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings[0]).toHaveTextContent('Exam term moved');
    expect(screen.getByRole('link', { name: 'Algorithms' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/courses/${notifications[0]!.courseOfferingId}`,
    );
  });

  it('names the assignment and the date it falls due', async () => {
    renderWidget();

    expect(await screen.findByText('New assignment deadline')).toBeInTheDocument();
    expect(screen.getByText('Assignment 1')).toBeInTheDocument();
    expect(screen.getByText(/^Due /)).toBeInTheDocument();
  });

  it('counts the unread deliveries and marks an aggregated change as one entry', async () => {
    renderWidget();

    expect(await screen.findByText('1 unread notification')).toBeInTheDocument();
    expect(screen.getByText('2 changes')).toBeInTheDocument();
  });

  it('offers to mark an unread notification read and nothing on a read one', async () => {
    renderWidget();

    await screen.findByText('Exam term moved');
    expect(screen.getAllByRole('button', { name: 'Mark as read' })).toHaveLength(1);
  });

  it('marks a notification read', async () => {
    let readId: string | undefined;
    server.use(
      http.post(`${NOTIFICATIONS_URL}/:id/read`, ({ params }) => {
        readId = params['id'] as string;

        return HttpResponse.json({
          ...notifications[0],
          readAt: new Date().toISOString(),
        });
      }),
    );

    const { user } = renderWidget();
    await user.click(await screen.findByRole('button', { name: 'Mark as read' }));

    await waitFor(() => {
      expect(readId).toBe(notifications[0]!.id);
    });
  });

  it('marks every notification read at once', async () => {
    let markedAll = false;
    server.use(
      http.post(`${NOTIFICATIONS_URL}/read-all`, () => {
        markedAll = true;

        return HttpResponse.json({ unreadCount: 0 });
      }),
    );

    const { user } = renderWidget();
    await user.click(await screen.findByRole('button', { name: 'Mark all as read' }));

    await waitFor(() => {
      expect(markedAll).toBe(true);
    });
  });

  it('sends a queueing student to the enrolment screen when a place comes free', async () => {
    server.use(
      http.get(NOTIFICATIONS_URL, () =>
        HttpResponse.json([{ ...notifications[0], type: 'waitlist_place_free' }]),
      ),
    );

    renderWidget();

    expect(
      await screen.findByText('A place came free on a course you are waiting for'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Places go to whoever asks first/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Algorithms' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/enroll`,
    );
  });

  it('takes a discussion reply straight to its thread', async () => {
    server.use(
      http.get(NOTIFICATIONS_URL, () =>
        HttpResponse.json([
          {
            ...notifications[0],
            type: 'discussion_reply',
            threadTitle: 'Question 3',
            discussionThreadId: '99999999-9999-4999-8999-999999999999',
          },
        ]),
      ),
    );

    renderWidget();

    expect(await screen.findByText('New reply in a discussion')).toBeInTheDocument();
    expect(screen.getByText('Question 3')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Algorithms' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/courses/${notifications[0]!.courseOfferingId}?section=discussion&thread=99999999-9999-4999-8999-999999999999`,
    );
  });

  it('says so when nothing has changed yet', async () => {
    server.use(http.get(NOTIFICATIONS_URL, () => HttpResponse.json([])));

    renderWidget();

    expect(
      await screen.findByText('Nothing has changed in your courses yet.'),
    ).toBeInTheDocument();
  });

  it('explains a failed load instead of rendering an empty inbox', async () => {
    server.use(http.get(NOTIFICATIONS_URL, () => HttpResponse.error()));

    renderWidget();

    expect(
      await screen.findByText('Notifications could not be loaded'),
    ).toBeInTheDocument();
  });
});
