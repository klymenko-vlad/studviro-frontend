import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  auditEvents,
  renderWithProviders,
  screen,
  server,
  userEvent,
  within,
} from '@/shared/test';

import { AuditTrail } from './audit-trail';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const AUDIT = `/api/proxy/api/v1/institutions/${INSTITUTION}/audit-events`;

const render = () => renderWithProviders(<AuditTrail institutionId={INSTITUTION} />);

describe('AuditTrail', () => {
  it('shows the change, not just the state it ended in', async () => {
    render();

    const list = await screen.findByRole('list', { name: 'Audit trail' });
    const published = within(list)
      .getByText('Published a grade for Algorithms')
      .closest('li');

    expect(within(published!).getByText(/officialGrade/)).toBeInTheDocument();
    expect(within(published!).getByText(/nothing → B/)).toBeInTheDocument();
    expect(within(published!).getByText(/proposed → official/)).toBeInTheDocument();
  });

  it('names the actor rather than printing a uuid', async () => {
    render();

    const list = await screen.findByRole('list', { name: 'Audit trail' });

    expect(within(list).getByText('Jana Nováková')).toBeInTheDocument();
  });

  it('says so when the system acted rather than a person', async () => {
    render();

    const list = await screen.findByRole('list', { name: 'Audit trail' });

    expect(within(list).getByText('The system')).toBeInTheDocument();
  });

  it('filters by action, and asks the server rather than the page', async () => {
    let asked: string | null = null;
    server.use(
      http.get(AUDIT, ({ request }) => {
        asked = new URL(request.url).searchParams.get('action');
        return HttpResponse.json(auditEvents);
      }),
    );

    render();
    await screen.findByRole('list', { name: 'Audit trail' });

    await userEvent.selectOptions(screen.getByLabelText('Show'), 'role.granted');

    await screen.findByRole('list', { name: 'Audit trail' });
    expect(asked).toBe('role.granted');
  });

  it('says nothing has been recorded rather than showing an empty list', async () => {
    server.use(http.get(AUDIT, () => HttpResponse.json({ ...auditEvents, items: [] })));

    render();

    expect(await screen.findByText('Nothing has been recorded yet.')).toBeInTheDocument();
  });

  it('admits that older entries exist rather than implying this is all of it', async () => {
    server.use(
      http.get(AUDIT, () =>
        HttpResponse.json({
          ...auditEvents,
          meta: { limit: 50, hasNextPage: true, nextCursor: 'next' },
        }),
      ),
    );

    render();

    expect(
      await screen.findByText('Older entries exist than are shown here.'),
    ).toBeInTheDocument();
  });

  it('reports a failure instead of an empty trail', async () => {
    server.use(http.get(AUDIT, () => new HttpResponse(null, { status: 500 })));

    render();

    expect(
      await screen.findByText('The audit trail could not be read.'),
    ).toBeInTheDocument();
  });
});
