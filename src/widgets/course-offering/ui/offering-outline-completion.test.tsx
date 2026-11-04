import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  learningMaterials,
  myProgress,
  renderWithProviders,
  screen,
  server,
  userEvent,
  waitFor,
  within,
} from '@/shared/test';

import { OfferingOutline } from './offering-outline';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const SPACE = '9a1f0b3c-1111-4111-8111-111111111111';
const SPACE_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/learning-spaces/${SPACE}`;
const MARKING_NOTE = learningMaterials[2]!;
const LINK = learningMaterials[1]!;

const render = (viewerRole: 'student' | 'teacher') =>
  renderWithProviders(
    <OfferingOutline
      institutionId={INSTITUTION}
      offeringId={OFFERING}
      spaceId={SPACE}
      viewerRole={viewerRole}
    />,
  );

function recordRequests(method: 'put' | 'post' | 'patch', path: string) {
  const calls: { url: string; body: unknown }[] = [];

  server.use(
    http[method](`${SPACE_URL}${path}`, async ({ request }) => {
      const body = method === 'post' ? null : await request.json();
      calls.push({ url: request.url, body });

      if (method === 'post') return new HttpResponse(null, { status: 204 });

      const answer = method === 'put' ? myProgress.items[0]! : MARKING_NOTE;
      return HttpResponse.json({ ...answer, ...(body as object) });
    }),
  );

  return calls;
}

describe('OfferingOutline — completion', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  describe('for a student', () => {
    it('shows how far through the course they are, and each section', async () => {
      render('student');

      const course = await screen.findByRole('progressbar', { name: 'Your progress' });
      expect(course).toHaveAttribute('aria-valuetext', '1 of 3 done');

      const week = screen.getByRole('progressbar', {
        name: 'Progress in Week 1 — sorting',
      });
      expect(week).toHaveAttribute('aria-valuetext', '1 of 2 done');
      expect(
        screen.getByRole('progressbar', { name: 'Progress in General' }),
      ).toHaveAttribute('aria-valuetext', '0 of 1 done');
    });

    it('ticks an item whose rule is the student’s own tick', async () => {
      const calls = recordRequests('put', '/my-completions/:kind/:itemId');
      render('student');

      const toggle = await screen.findByRole('button', {
        name: 'Mark How marking works as done',
      });
      expect(toggle).toHaveAttribute('aria-pressed', 'false');

      await userEvent.click(toggle);

      await waitFor(() => {
        expect(calls).toHaveLength(1);
      });
      expect(calls[0]!.url).toContain(`/my-completions/material/${MARKING_NOTE.id}`);
      expect(calls[0]!.body).toEqual({ done: true });
    });

    it('shows a tick on what is done and what is still to do on the rest', async () => {
      render('student');

      const week = await screen.findByRole('region', { name: 'Week 1 — sorting' });
      const [slides, assignment] = within(week).getAllByRole('listitem');

      expect(within(slides!).getByText('Done')).toBeInTheDocument();
      expect(
        within(assignment!).getByText('Done once you hand it in'),
      ).toBeInTheDocument();
    });

    it('records that a link was opened when the student follows it', async () => {
      server.use(
        http.get(`${SPACE_URL}/materials`, () =>
          HttpResponse.json([{ ...LINK, visible: true, completionRule: 'viewed' }]),
        ),
        http.get(`${SPACE_URL}/my-progress`, () =>
          HttpResponse.json({
            done: 0,
            total: 1,
            sections: [{ sectionId: null, done: 0, total: 1 }],
            items: [
              {
                kind: 'material',
                id: LINK.id,
                sectionId: null,
                rule: 'viewed',
                state: 'incomplete',
                completedAt: null,
              },
            ],
          }),
        ),
      );
      const calls = recordRequests('post', '/materials/:materialId/views');
      render('student');

      const link = await screen.findByRole('link', { name: LINK.url! });
      link.addEventListener('click', event => {
        event.preventDefault();
      });
      await userEvent.click(link);

      await waitFor(() => {
        expect(calls).toHaveLength(1);
      });
      expect(calls[0]!.url).toContain(`/materials/${LINK.id}/views`);
    });

    it('records a note shown in the outline as opened, once', async () => {
      server.use(
        http.get(`${SPACE_URL}/my-progress`, () =>
          HttpResponse.json({
            ...myProgress,
            items: [{ ...myProgress.items[0]!, rule: 'viewed' }],
          }),
        ),
      );
      const calls = recordRequests('post', '/materials/:materialId/views');
      render('student');

      await waitFor(() => {
        expect(calls).toHaveLength(1);
      });
      expect(calls[0]!.url).toContain(`/materials/${MARKING_NOTE.id}/views`);
    });

    it('shows no progress at all on a course that tracks nothing', async () => {
      server.use(
        http.get(`${SPACE_URL}/my-progress`, () =>
          HttpResponse.json({ done: 0, total: 0, sections: [], items: [] }),
        ),
      );
      render('student');

      await screen.findByRole('region', { name: 'General' });
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /as done/u })).not.toBeInTheDocument();
    });
  });

  describe('for a teacher', () => {
    it('shows each item’s rule instead of a tick, and no progress', async () => {
      render('teacher');

      const week = await screen.findByRole('region', { name: 'Week 1 — sorting' });
      expect(within(week).getByText('Done: when handed in')).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: 'Completion for Lecture 1 — slides' }),
      ).toHaveValue('viewed');
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('changes a material’s rule from the outline', async () => {
      const calls = recordRequests('patch', '/materials/:materialId');
      render('teacher');

      await userEvent.selectOptions(
        await screen.findByRole('combobox', { name: 'Completion for How marking works' }),
        'viewed',
      );

      await waitFor(() => {
        expect(calls).toHaveLength(1);
      });
      expect(calls[0]!.body).toEqual({ completionRule: 'viewed' });
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Completion rule saved');
      });
    });
  });
});
