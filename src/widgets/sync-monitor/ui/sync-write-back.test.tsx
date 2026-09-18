import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen, server, waitFor, within } from '@/shared/test';

import { SyncWriteBack } from './sync-write-back';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/synchronization/write-intents`;

function render(canRun = true) {
  return renderWithProviders(
    <SyncWriteBack institutionId={INSTITUTION} canRun={canRun} />,
  );
}

describe('SyncWriteBack', () => {
  it('names the write, its state and the answer the source gave', async () => {
    render();

    const row = within(await screen.findByTestId('write-back-table')).getAllByRole(
      'row',
    )[1]!;

    expect(within(row).getByText('Exam registration')).toBeInTheDocument();
    expect(within(row).getByText('Refused')).toBeInTheDocument();
    expect(
      within(row).getByText(/retake seat is assigned by the study department/i),
    ).toBeInTheDocument();
  });

  it('offers retry and discard to somebody who may run a synchronization', async () => {
    render();

    expect(await screen.findByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Discard' })).toBeInTheDocument();
  });

  it('withholds both actions from a reader who may only look', async () => {
    render(false);

    await screen.findByTestId('write-back-table');

    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();
  });

  it('says so plainly when the source owes no answer', async () => {
    server.use(http.get(URL, () => HttpResponse.json([])));
    render();

    expect(await screen.findByTestId('write-back-empty')).toHaveTextContent(
      /has been acknowledged/i,
    );
  });

  it('reports a failure to read the outbox rather than showing an empty one', async () => {
    server.use(http.get(URL, () => new HttpResponse(null, { status: 500 })));
    render();

    await waitFor(() => {
      expect(screen.getByText(/could not be read/i)).toBeInTheDocument();
    });
  });
});
