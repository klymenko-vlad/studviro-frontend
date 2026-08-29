import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { permissions, renderWithProviders, screen, server } from '@/shared/test';

import { MyExamsView } from './my-exams-view';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;

describe('MyExamsView', () => {
  it('heads the screen and shows the exams the server returned', async () => {
    renderWithProviders(<MyExamsView institutionId={INSTITUTION} />);

    expect(
      await screen.findByRole('heading', { name: 'Exams', level: 1 }),
    ).toBeInTheDocument();
    expect(await screen.findByTestId('my-exams')).toBeInTheDocument();
  });

  it('refuses a caller the server does not grant schedule:read', async () => {
    server.use(
      http.get(PERMISSIONS_URL, () =>
        HttpResponse.json({ ...permissions, permissions: ['grade:read'] }),
      ),
    );

    renderWithProviders(<MyExamsView institutionId={INSTITUTION} />);

    expect(await screen.findByText('Not available to you')).toBeInTheDocument();
    expect(screen.queryByTestId('my-exams')).not.toBeInTheDocument();
  });
});
