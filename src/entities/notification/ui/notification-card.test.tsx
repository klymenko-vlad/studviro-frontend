import { describe, expect, it } from 'vitest';

import { notifications, renderWithProviders, screen } from '@/shared/test';

import type { Notification } from '../model/notification';
import { NotificationCard } from './notification-card';

const base = notifications[0]!;

const card = (overrides: Partial<Notification>) =>
  renderWithProviders(<NotificationCard notification={{ ...base, ...overrides }} />);

describe('NotificationCard', () => {
  it('names a published grade and the grade itself', () => {
    card({ type: 'grade_published', grade: 'B', startsAt: null });

    expect(screen.getByText('Grade published')).toBeInTheDocument();
    expect(screen.getByTestId('notification-grade')).toHaveTextContent('Grade: B');
  });

  it('names both grades when one was corrected', () => {
    card({ type: 'grade_corrected', grade: 'A', previousGrade: 'C', startsAt: null });

    expect(screen.getByTestId('notification-grade')).toHaveTextContent(
      'Grade changed from C to A',
    );
  });

  it('names the attempt for a resit and stays quiet about the first sitting', () => {
    card({ type: 'grade_published', grade: 'C', attempt: 2, startsAt: null });
    expect(screen.getByTestId('notification-grade')).toHaveTextContent('Attempt 2');
  });

  it('says why the university refused a registration', () => {
    card({
      type: 'exam_registration_refused',
      reason: 'A retake seat is assigned by the study department',
      startsAt: null,
    });

    expect(
      screen.getByText('The university refused your exam registration'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('notification-reason')).toHaveTextContent(
      /assigned by the study department/,
    );
  });

  it('confirms the student’s own act', () => {
    card({ type: 'exam_registration_confirmed', startsAt: null });

    expect(screen.getByText('You registered for an exam')).toBeInTheDocument();
  });

  it('names the class that moved', () => {
    card({
      type: 'timetable_event_rescheduled',
      eventTitle: 'Sorting',
      startsAt: '2026-03-05T09:00:00.000Z',
      previousStartsAt: '2026-03-04T09:00:00.000Z',
    });

    expect(screen.getByText('Class moved')).toBeInTheDocument();
    expect(screen.getByText('Sorting')).toBeInTheDocument();
  });

  it('names an enrolment outcome', () => {
    card({ type: 'enrollment_confirmed', startsAt: null });

    expect(screen.getByText('Place in the course confirmed')).toBeInTheDocument();
  });

  it('names the assignment and the points when work comes back marked', () => {
    card({
      type: 'submission_marked',
      activityName: 'Assignment 1 — sorting',
      grade: '17.5 / 20',
      startsAt: null,
    });

    expect(screen.getByText('Assignment marked')).toBeInTheDocument();
    expect(screen.getByText('Assignment 1 — sorting')).toBeInTheDocument();
    expect(screen.getByTestId('notification-grade')).toHaveTextContent(
      'Grade: 17.5 / 20',
    );
  });

  it('shows no grade line for a notification that carries none', () => {
    card({ type: 'exam_term_published' });

    expect(screen.queryByTestId('notification-grade')).not.toBeInTheDocument();
    expect(screen.queryByTestId('notification-reason')).not.toBeInTheDocument();
  });
});
