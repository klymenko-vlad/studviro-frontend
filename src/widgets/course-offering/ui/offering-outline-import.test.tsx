import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen, server } from '@/shared/test';

import { OfferingOutline } from './offering-outline';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const SPACE = '9a1f0b3c-1111-4111-8111-111111111111';
const SPACE_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/learning-spaces/${SPACE}`;

const render = (viewerRole: 'student' | 'administrator') =>
  renderWithProviders(
    <OfferingOutline
      institutionId={INSTITUTION}
      offeringId={OFFERING}
      spaceId={SPACE}
      viewerRole={viewerRole}
    />,
  );

describe('OfferingOutline import from another course', () => {
  it('is not offered to a student', async () => {
    render('student');

    expect(await screen.findByRole('region', { name: 'General' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Import from another course' }),
    ).toBeNull();
  });

  it('opens the import panel for an author, one panel at a time', async () => {
    server.use(
      http.get(`${SPACE_URL}/import/sources`, () =>
        HttpResponse.json({
          items: [],
          meta: {
            page: 1,
            limit: 10,
            total: 0,
            pageCount: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        }),
      ),
    );
    const user = userEvent.setup();
    render('administrator');

    const open = await screen.findByRole('button', {
      name: 'Import from another course',
    });
    await user.click(open);

    expect(open).toHaveAttribute('aria-expanded', 'true');
    expect(
      await screen.findByText('No other course page you teach matches.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'View as a student' }));
    expect(open).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByRole('region', { name: 'Import from another course' }),
    ).toBeNull();
  });
});
