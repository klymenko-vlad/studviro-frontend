import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  renderWithProviders,
  screen,
  searchResults,
  server,
  userEvent,
  within,
} from '@/shared/test';

import { InstitutionSearch } from './institution-search';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const SEARCH = `/api/proxy/api/v1/institutions/${INSTITUTION}/search`;

const render = () =>
  renderWithProviders(<InstitutionSearch institutionId={INSTITUTION} />);

const type = async (value: string) => {
  await userEvent.type(screen.getByLabelText('What are you looking for?'), value);
};

describe('InstitutionSearch', () => {
  it('asks for nothing until the query is long enough', async () => {
    let asked = 0;
    server.use(
      http.get(SEARCH, () => {
        asked += 1;
        return HttpResponse.json(searchResults);
      }),
    );

    render();
    await type('a');

    expect(asked).toBe(0);
  });

  it('groups what it finds, most useful kind first', async () => {
    render();
    await type('algorithms');

    const region = await screen.findByRole('region', { name: 'Search' });
    const headings = within(region)
      .getAllByRole('heading', { level: 2 })
      .map(heading => heading.textContent);

    expect(headings).toEqual(['On offer', 'Courses', 'Rooms']);
  });

  it('links a hit somewhere it can actually be opened', async () => {
    render();
    await type('algorithms');

    const onOffer = await screen.findByRole('heading', { name: 'On offer' });
    const group = onOffer.parentElement!;
    const offering = within(group).getByRole('link');

    expect(offering).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/courses/66666666-6666-4666-8666-666666666666`,
    );
  });

  it('names the kinds it was not allowed to search, rather than staying silent', async () => {
    render();
    await type('algorithms');

    expect(
      await screen.findByText(/Not searched, because your role/),
    ).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('Org units')).toBeInTheDocument();
  });

  it('says nothing matched rather than showing an empty list', async () => {
    server.use(
      http.get(SEARCH, () =>
        HttpResponse.json({ ...searchResults, hits: [], searched: ['course'] }),
      ),
    );

    render();
    await type('zzzz');

    expect(await screen.findByText('Nothing matches “zzzz”.')).toBeInTheDocument();
  });

  it('warns when there are more matches than it showed', async () => {
    server.use(
      http.get(SEARCH, () => HttpResponse.json({ ...searchResults, truncated: true })),
    );

    render();
    await type('algorithms');

    expect(
      await screen.findByText('There are more matches than shown. Try a longer query.'),
    ).toBeInTheDocument();
  });

  it('reports a failed search instead of an empty one', async () => {
    server.use(http.get(SEARCH, () => new HttpResponse(null, { status: 500 })));

    render();
    await type('algorithms');

    expect(await screen.findByText('The search could not be run.')).toBeInTheDocument();
  });
});
