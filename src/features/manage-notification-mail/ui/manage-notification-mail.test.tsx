import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { renderAndAudit, renderWithProviders, screen, server } from '@/shared/test';

import { ManageNotificationMail } from './manage-notification-mail';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const PREFERENCES = '/api/proxy/api/v1/users/me/notification-preferences';

describe('ManageNotificationMail', () => {
  it('shows a group as on only when every type in it is chosen', async () => {
    renderWithProviders(<ManageNotificationMail />);

    expect(
      await screen.findByRole('switch', { name: 'Assignments and grades' }),
    ).not.toBeChecked();
    expect(screen.getByRole('switch', { name: 'Exams' })).not.toBeChecked();
  });

  it('turns a whole group on and keeps the rest of the set', async () => {
    let sent: { emailTypes: string[] } | undefined;
    server.use(
      http.put(PREFERENCES, async ({ request }) => {
        sent = (await request.json()) as { emailTypes: string[] };
        return HttpResponse.json(sent);
      }),
    );
    const { user } = renderWithProviders(<ManageNotificationMail />);

    await user.click(await screen.findByRole('switch', { name: 'Discussion' }));

    await vi.waitFor(() => {
      expect(sent).toEqual({
        emailTypes: [
          'grade_published',
          'grade_corrected',
          'discussion_thread_started',
          'discussion_reply',
        ],
      });
    });
    expect(await screen.findByRole('switch', { name: 'Discussion' })).toBeChecked();
  });

  it('turns a group off', async () => {
    server.use(
      http.get(PREFERENCES, () =>
        HttpResponse.json({
          emailTypes: ['timetable_event_rescheduled', 'timetable_event_cancelled'],
        }),
      ),
    );
    const { user } = renderWithProviders(<ManageNotificationMail />);

    const timetable = await screen.findByRole('switch', { name: 'Timetable' });
    expect(timetable).toBeChecked();
    await user.click(timetable);

    await vi.waitFor(() => {
      expect(screen.getByRole('switch', { name: 'Timetable' })).not.toBeChecked();
    });
  });

  it('says so when the choices cannot be loaded', async () => {
    server.use(
      http.get(PREFERENCES, () =>
        HttpResponse.json({ statusCode: 500, message: 'boom' }, { status: 500 }),
      ),
    );
    renderWithProviders(<ManageNotificationMail />);

    expect(
      await screen.findByText('Your e-mail choices could not be loaded'),
    ).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    await renderAndAudit(<ManageNotificationMail />, () =>
      screen.findByRole('switch', { name: 'Exams' }),
    );
  });
});
