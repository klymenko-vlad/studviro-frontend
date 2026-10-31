import { describe, expect, it } from 'vitest';

import { courseOffering, renderWithProviders, screen } from '@/shared/test';

import { OfferingHeader } from './offering-header';

describe('OfferingHeader', () => {
  it('names the teaching language instead of printing its code', () => {
    renderWithProviders(<OfferingHeader offering={courseOffering} />);

    expect(screen.getByText('Taught in Slovak')).toBeInTheDocument();
    expect(screen.queryByText('Taught in sk')).not.toBeInTheDocument();
  });

  it('calls a student withdrawn after their grade withdrawn rather than enrolled', () => {
    renderWithProviders(
      <OfferingHeader
        offering={{
          ...courseOffering,
          viewerRole: 'student',
          enrollment: {
            enrollmentId: '99999999-9999-4999-8999-999999999991',
            status: 'withdrawn',
            requirementType: 'compulsory',
            attempt: 1,
            enrolledAt: '2026-02-10T00:00:00.000Z',
          },
        }}
      />,
    );

    expect(screen.getByText('Withdrawn')).toBeInTheDocument();
    expect(screen.queryByText('Enrolled')).not.toBeInTheDocument();
  });

  it('shows a code it cannot name as it is', () => {
    renderWithProviders(
      <OfferingHeader
        offering={{
          ...courseOffering,
          offering: { ...courseOffering.offering, language: 'zz-unknown' },
        }}
      />,
    );

    expect(screen.getByText(/^Taught in /)).toBeInTheDocument();
  });
});
