import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { Catalogue } from '@/widgets/catalogue';
import { ProgramMembers } from '@/widgets/program-members';
import {
  institutionConfiguration,
  renderWithProviders,
  screen,
  server,
  within,
} from '@/shared/test';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const PROGRAM = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1';
const CONFIG = `/api/proxy/api/v1/institutions/${INSTITUTION}/configuration`;

/**
 * U6. An institution may call a student a *pupil* and credits *points*, and
 * the whole point of the setting is that the word follows them around the
 * product rather than appearing only where it was first implemented.
 */
const renamed = (terminology: Record<string, string | null>) => {
  server.use(
    http.get(CONFIG, () =>
      HttpResponse.json({
        ...institutionConfiguration,
        terminology: { ...institutionConfiguration.terminology, ...terminology },
      }),
    ),
  );
};

describe('the institution’s own words (U6)', () => {
  it('uses the institution’s word for credits in the catalogue', async () => {
    renamed({ credits: 'Points' });

    renderWithProviders(<Catalogue institutionId={INSTITUTION} />);

    const table = await screen.findByTestId('courses-table');
    expect(within(table).getByText('Points')).toBeInTheDocument();
    expect(within(table).queryByText('Credits')).not.toBeInTheDocument();
  });

  it('falls back to the platform’s word when the institution has not chosen one', async () => {
    renderWithProviders(<Catalogue institutionId={INSTITUTION} />);

    const table = await screen.findByTestId('courses-table');
    expect(within(table).getByText('Credits')).toBeInTheDocument();
  });

  it('uses the institution’s word for a student on the programme roll', async () => {
    renamed({ student: 'Pupil' });

    renderWithProviders(
      <ProgramMembers institutionId={INSTITUTION} programId={PROGRAM} />,
    );

    const table = await screen.findByTestId('program-members-table');
    expect(within(table).getByText('Pupil')).toBeInTheDocument();
    expect(within(table).queryByText('Student')).not.toBeInTheDocument();
  });
});
