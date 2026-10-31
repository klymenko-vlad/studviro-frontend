import { describe, expect, it } from 'vitest';

import { courseResults, renderWithProviders, screen } from '@/shared/test';

import { CourseResultCard } from './course-result-card';

const official = courseResults[0]!;

describe('CourseResultCard', () => {
  it('shows the effective grade of a standing result', () => {
    renderWithProviders(<CourseResultCard result={official} />);

    expect(screen.queryByTestId('result-annulled-note')).not.toBeInTheDocument();
  });

  it('marks an annulled result and says it counts towards nothing', () => {
    renderWithProviders(
      <CourseResultCard
        result={{ ...official, status: 'annulled', effective: null, isVoided: true }}
      />,
    );

    expect(screen.getByText('No standing')).toBeInTheDocument();
    expect(screen.getByTestId('result-annulled-note')).toHaveTextContent(
      /counts towards nothing/i,
    );
  });

  it('keeps the grade of a withdrawn enrolment and says it was withdrawn', () => {
    renderWithProviders(
      <CourseResultCard result={{ ...official, enrollmentStatus: 'withdrawn' }} />,
    );

    expect(screen.getByText('Withdrawn')).toBeInTheDocument();
    expect(screen.getByTestId('result-withdrawn-note')).toHaveTextContent(
      /stays on your record/i,
    );
    expect(
      screen.getByText('A', { selector: '[aria-label="A, Official"]' }),
    ).toBeInTheDocument();
  });

  it('says nothing about withdrawal while the student is in the course', () => {
    renderWithProviders(<CourseResultCard result={official} />);

    expect(screen.queryByTestId('result-withdrawn-note')).not.toBeInTheDocument();
  });

  it('does not fall back to “no grade yet” for a result that was struck', () => {
    renderWithProviders(
      <CourseResultCard
        result={{ ...official, status: 'annulled', effective: null, isVoided: true }}
      />,
    );

    expect(screen.queryByText('Not graded yet')).not.toBeInTheDocument();
  });
});
