import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type { QuizResponseDto } from '@/shared/api';
import {
  offeringQuizzes,
  renderWithProviders,
  screen,
  server,
  userEvent,
  within,
} from '@/shared/test';

import { OfferingOutline } from './offering-outline';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const SPACE = '9a1f0b3c-1111-4111-8111-111111111111';
const SPACE_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/learning-spaces/${SPACE}`;
const quiz = offeringQuizzes[0]!;

const render = (
  viewerRole: 'student' | 'teacher',
  quizzes: QuizResponseDto[] = [quiz],
) => {
  server.use(http.get(`${SPACE_URL}/quizzes`, () => HttpResponse.json(quizzes)));

  return renderWithProviders(
    <OfferingOutline
      institutionId={INSTITUTION}
      offeringId={OFFERING}
      spaceId={SPACE}
      viewerRole={viewerRole}
    />,
  );
};

const quizRow = async () =>
  (await screen.findByText('Foundations quiz')).closest('li') as HTMLElement;

describe('a quiz on the course page', () => {
  it('shows a student its settings and a start that is not open yet', async () => {
    render('student');
    const row = await quizRow();

    expect(within(row).getByText('Quiz')).toBeInTheDocument();
    expect(
      within(row).getByText(
        '10 minutes · 2 attempts · Highest grade counts · 5 questions',
      ),
    ).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: 'Start' })).toBeDisabled();
    expect(within(row).getByRole('status')).toHaveTextContent('coming soon');
    expect(within(row).queryByRole('link')).toBeNull();
  });

  it('tells a student when attempts open', async () => {
    render('student', [
      { ...quiz, settings: { ...quiz.settings!, attempts: 'upcoming' } },
    ]);
    const row = await quizRow();

    expect(within(row).getByRole('status')).toHaveTextContent(/^Attempts open on/);
  });

  it('shows only the title and when it opens to a student before it is available', async () => {
    render('student', [
      {
        ...quiz,
        brief: null,
        settings: null,
        availability: 'scheduled',
        availableFrom: '2030-01-01T08:00:00.000Z',
      },
    ]);
    const row = await quizRow();

    expect(within(row).queryByRole('button', { name: 'Start' })).toBeNull();
    expect(within(row).getByText(/Opens/)).toBeInTheDocument();
  });

  it('links an author to the quiz editor and the question bank', async () => {
    render('teacher');
    const row = await quizRow();

    expect(within(row).getByRole('link', { name: 'Foundations quiz' })).toHaveAttribute(
      'href',
      expect.stringContaining(`/spaces/${SPACE}/quizzes/${quiz.id}`),
    );
    expect(within(row).queryByRole('button', { name: 'Start' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Question bank' })).toHaveAttribute(
      'href',
      expect.stringContaining(`/spaces/${SPACE}/question-bank`),
    );
  });

  it('adds a hidden quiz to a section by name and links to setting it up', async () => {
    let sent: Record<string, unknown> | undefined;
    server.use(
      http.post(`${SPACE_URL}/quizzes`, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...quiz, ...sent }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    render('teacher');

    const week = await screen.findByRole('region', { name: 'Week 1 — sorting' });
    await user.click(
      within(week).getByRole('button', { name: 'Add quiz to Week 1 — sorting' }),
    );
    const form = within(week).getByRole('form', { name: 'Add a quiz' });
    await user.type(within(form).getByLabelText('Name'), 'Week 2 quiz');
    await user.click(within(form).getByRole('button', { name: 'Add the quiz' }));

    expect(
      await within(week).findByRole('link', {
        name: 'Set up Week 2 quiz: its questions and settings',
      }),
    ).toHaveAttribute('href', expect.stringContaining('/quizzes/'));
    expect(sent).toEqual({
      name: 'Week 2 quiz',
      visible: false,
      sectionId: '5ec70001-0001-4001-8001-000000000001',
    });
  });

  it('lets a restriction wait for a mark in a quiz', async () => {
    const user = userEvent.setup();
    render('teacher');

    await quizRow();
    const general = screen.getByRole('region', { name: 'General' });
    const [access] = within(general).getAllByRole('button', { name: /^Access to/ });
    await user.click(access!);
    const form = within(general).getByRole('form', { name: /^Access to/ });
    await user.selectOptions(within(form).getByLabelText('Condition'), 'mark');

    const items = within(form).getByLabelText('Assignment or quiz');
    expect(
      within(items).getByRole('option', { name: 'Foundations quiz' }),
    ).toBeInTheDocument();
  });
});
