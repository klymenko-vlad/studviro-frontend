import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '@/shared/test';

import { AddToCalendarLink } from './add-to-calendar-link';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const ENTRY = '66666666-6666-4666-8666-666666666666';

describe('AddToCalendarLink', () => {
  it.each([
    ['class', 'Algorithms – Lecture'],
    ['exam', 'Algorithms'],
    ['deadline', 'Sorting essay'],
  ] as const)(
    'downloads the one %s as a calendar file, named by what it adds',
    (kind, title) => {
      renderWithProviders(
        <AddToCalendarLink
          institutionId={INSTITUTION}
          kind={kind}
          id={ENTRY}
          title={title}
        />,
      );

      const link = screen.getByRole('link', { name: `Add ${title} to your calendar` });

      expect(link).toHaveAttribute(
        'href',
        `/api/proxy/api/v1/institutions/${INSTITUTION}/me/calendar-entries/${kind}/${ENTRY}`,
      );
      expect(link).toHaveAttribute('download');
      expect(link).toHaveTextContent('Add to calendar');
    },
  );
});
