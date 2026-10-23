import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '@/shared/test';

import { AvailabilityNote } from './availability-note';

const OPENS = '2026-11-02T07:00:00.000Z';
const ENDS = '2026-12-01T07:00:00.000Z';

const open = {
  availableFrom: null,
  availableUntil: null,
  hiddenUntilAvailable: false,
  availability: 'open',
} as const;

describe('AvailabilityNote', () => {
  it('tells a student when a scheduled item opens, in a sentence', () => {
    renderWithProviders(
      <AvailabilityNote
        audience="student"
        item={{ ...open, availability: 'scheduled', availableFrom: OPENS }}
      />,
    );

    expect(screen.getByText('Opens on November 2 at 09:00')).toBeInTheDocument();
  });

  it('tells a student until when an open item stays', () => {
    renderWithProviders(
      <AvailabilityNote audience="student" item={{ ...open, availableUntil: ENDS }} />,
    );

    expect(screen.getByText('Available until December 1 at 09:00')).toBeInTheDocument();
  });

  it('says nothing to a student about an item that is simply open', () => {
    const { container } = renderWithProviders(
      <AvailabilityNote audience="student" item={open} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('badges a scheduled item for its author, and says when it is hidden until then', () => {
    const scheduled = {
      ...open,
      availability: 'scheduled',
      availableFrom: OPENS,
    } as const;

    const { rerender } = renderWithProviders(
      <AvailabilityNote audience="author" item={scheduled} />,
    );
    expect(screen.getByText('Opens November 2 at 09:00')).toBeInTheDocument();

    rerender(
      <AvailabilityNote
        audience="author"
        item={{ ...scheduled, hiddenUntilAvailable: true }}
      />,
    );
    expect(screen.getByText('Hidden until November 2 at 09:00')).toBeInTheDocument();
  });

  it('badges an ended item, and an open one that will end, for its author', () => {
    const { rerender } = renderWithProviders(
      <AvailabilityNote
        audience="author"
        item={{ ...open, availability: 'ended', availableUntil: ENDS }}
      />,
    );
    expect(screen.getByText('Ended December 1 at 09:00')).toBeInTheDocument();

    rerender(
      <AvailabilityNote audience="author" item={{ ...open, availableUntil: ENDS }} />,
    );
    expect(screen.getByText('Until December 1 at 09:00')).toBeInTheDocument();
  });
});
