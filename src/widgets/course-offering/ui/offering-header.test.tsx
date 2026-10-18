import { describe, expect, it } from 'vitest';

import { courseOffering, renderWithProviders, screen } from '@/shared/test';

import { OfferingHeader } from './offering-header';

describe('OfferingHeader', () => {
  it('names the teaching language instead of printing its code', () => {
    renderWithProviders(<OfferingHeader offering={courseOffering} />);

    expect(screen.getByText('Taught in Slovak')).toBeInTheDocument();
    expect(screen.queryByText('Taught in sk')).not.toBeInTheDocument();
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
