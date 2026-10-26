import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  deadlines,
  examTerms,
  renderWithProviders,
  screen,
  server,
  studyProgress,
  within,
} from '@/shared/test';

import { StudiesGlance } from './studies-glance';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const SUMMARY_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/course-results/summary`;
const DEADLINES_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/deadlines`;
const EXAMS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/exam-terms`;
const DAY = 24 * 60 * 60 * 1000;

const firstDeadline = deadlines[0]!;
const registeredExam = examTerms.find(
  term => term.myRegistration?.status === 'registered',
)!;
const openExam = examTerms.find(term => term.registrationAvailability.canRegister)!;

function before(iso: string, days: number) {
  return new Date(Date.parse(iso) - days * DAY);
}

function renderGlance(
  props: Partial<{
    canReadCourses: boolean;
    canReadGrades: boolean;
    canReadSchedule: boolean;
    canReadExams: boolean;
    now: Date;
  }> = {},
) {
  return renderWithProviders(
    <StudiesGlance
      institutionId={INSTITUTION}
      canReadCourses={props.canReadCourses ?? true}
      canReadGrades={props.canReadGrades ?? true}
      canReadSchedule={props.canReadSchedule ?? true}
      canReadExams={props.canReadExams ?? true}
      now={props.now ?? before(firstDeadline.dueAt, 3)}
    />,
  );
}

async function stat(label: string) {
  return within(await screen.findByRole('link', { name: new RegExp(`^${label}`) }));
}

describe('StudiesGlance', () => {
  it('puts the term’s courses and credits first, linked to the courses', async () => {
    renderGlance();

    const link = await screen.findByRole('link', { name: /^This term/ });
    expect(link).toHaveAttribute('href', `/institutions/${INSTITUTION}/courses`);
    expect(within(link).getByText(/\d+ courses?/)).toBeInTheDocument();
    expect(within(link).getByText(/\d+ credits/)).toBeInTheDocument();
  });

  it('shows the weighted average and the credits earned', async () => {
    renderGlance();

    const average = await stat('Average grade');
    expect(await average.findByText('1.00')).toBeInTheDocument();
    expect(average.getByText('6 credits earned')).toBeInTheDocument();
  });

  it('warns about a course waiting for its retake', async () => {
    server.use(
      http.get(SUMMARY_URL, () =>
        HttpResponse.json({ ...studyProgress, awaitingRetake: 1 }),
      ),
    );

    renderGlance();

    expect(await (await stat('Average grade')).findByText('1 course to retake')).toBeInTheDocument();
  });

  it('says how soon the next deadline falls due, and for what', async () => {
    server.use(http.get(DEADLINES_URL, () => HttpResponse.json(deadlines)));

    renderGlance();

    const next = await stat('Next deadline');
    expect(await next.findByText('in 3 days')).toBeInTheDocument();
    expect(
      next.getByText(`${firstDeadline.name} · ${firstDeadline.course.code}`),
    ).toBeInTheDocument();
  });

  it('says plainly when nothing falls due soon', async () => {
    server.use(http.get(DEADLINES_URL, () => HttpResponse.json([])));

    renderGlance();

    expect(await (await stat('Next deadline')).findByText('Nothing due')).toBeInTheDocument();
  });

  it('names the next exam the student is registered for', async () => {
    renderGlance({ now: before(registeredExam.startsAt, 2) });

    const exam = await stat('Next exam');
    expect(await exam.findByText('in 2 days')).toBeInTheDocument();
    expect(exam.getByText(new RegExp(registeredExam.course.title))).toBeInTheDocument();
  });

  it('points at exam dates open for registration when none is booked', async () => {
    server.use(http.get(EXAMS_URL, () => HttpResponse.json([openExam])));

    renderGlance({ now: before(openExam.startsAt, 10) });

    const exam = await stat('Next exam');
    expect(await exam.findByText('1 date open')).toBeInTheDocument();
    expect(exam.getByText('Register now')).toBeInTheDocument();
  });

  it('shows only what the student may read', async () => {
    renderGlance({ canReadGrades: false, canReadExams: false });

    expect(await screen.findByRole('link', { name: /^This term/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Average grade/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Next exam/ })).not.toBeInTheDocument();
  });
});
