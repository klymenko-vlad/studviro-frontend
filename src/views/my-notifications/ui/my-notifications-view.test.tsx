import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { permissions, renderWithProviders, screen, server } from '@/shared/test';

import { MyNotificationsView } from './my-notifications-view';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';

describe('MyNotificationsView', () => {
  it('shows the inbox to someone who may read notifications', async () => {
    renderWithProviders(<MyNotificationsView institutionId={INSTITUTION} />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Notifications' }),
    ).toBeInTheDocument();
    expect(await screen.findByTestId('my-notifications')).toBeInTheDocument();
  });

  it('refuses the inbox to someone whose role does not include it', async () => {
    server.use(
      http.get('/api/proxy/api/v1/institutions/:institutionId/me/permissions', () =>
        HttpResponse.json({
          ...permissions,
          permissions: permissions.permissions.filter(
            permission => permission !== 'notification:read',
          ),
        }),
      ),
    );

    renderWithProviders(<MyNotificationsView institutionId={INSTITUTION} />);

    expect(
      await screen.findByText('You cannot see notifications here'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('my-notifications')).not.toBeInTheDocument();
  });
});
