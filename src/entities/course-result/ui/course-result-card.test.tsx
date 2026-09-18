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

  it('does not fall back to “no grade yet” for a result that was struck', () => {
    renderWithProviders(
      <CourseResultCard
        result={{ ...official, status: 'annulled', effective: null, isVoided: true }}
      />,
    );

    expect(screen.queryByText('Not graded yet')).not.toBeInTheDocument();
  });
});
