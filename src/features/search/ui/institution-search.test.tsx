import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import {
  renderWithProviders,
  screen,
  searchResults,
  server,
  userEvent,
  within,
} from '@/shared/test';

import { useRecentSearchStore } from '../model/recent-search-store';
import { InstitutionSearch } from './institution-search';

const search = vi.hoisted(() => ({ value: new URLSearchParams() }));
const replace = vi.hoisted(() => vi.fn());

vi.mock('@/shared/config', async importOriginal => ({
  ...(await importOriginal<typeof SharedConfig>()),
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/institutions/x/search',
  useSearchParams: () => search.value,
}));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const SEARCH = `/api/proxy/api/v1/institutions/${INSTITUTION}/search`;

const render = () =>
  renderWithProviders(<InstitutionSearch institutionId={INSTITUTION} />);

const type = async (value: string) => {
  await userEvent.type(screen.getByLabelText('What are you looking for?'), value);
};

describe('InstitutionSearch', () => {
  beforeEach(() => {
    search.value = new URLSearchParams();
    replace.mockReset();
    useRecentSearchStore.setState({ byInstitution: {} });
  });

  it('keeps the query in the address, so a search can be linked to', async () => {
    render();
    await type('al');

    expect(replace).toHaveBeenLastCalledWith('/institutions/x/search?q=al', {
      scroll: false,
    });
  });

  it('opens on the search the address names', async () => {
    search.value = new URLSearchParams('q=algorithms');
    render();

    expect(screen.getByLabelText('What are you looking for?')).toHaveValue('algorithms');
    expect(
      await screen.findByRole('heading', { name: 'Course pages' }),
    ).toBeInTheDocument();
  });

  it('remembers a search that found something once a result is opened', async () => {
    const { user } = render();
    await type('algorithms');

    const onOffer = await screen.findByRole('heading', { name: 'Course pages' });
    await user.click(within(onOffer.parentElement!).getByRole('link'));

    expect(useRecentSearchStore.getState().queriesFor(INSTITUTION)).toEqual([
      'algorithms',
    ]);
  });

  it('offers recent searches and opened results before anything is typed', async () => {
    useRecentSearchStore.getState().remember(INSTITUTION, 'algo', {
      key: 'offering-1',
      title: 'Algorithms',
      subtitle: 'INF/ALG',
      context: null,
      href: '/institutions/x/courses/1',
    });

    const { user } = render();

    expect(
      await screen.findByRole('heading', { name: 'Recent searches' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Algorithms/ })).toHaveAttribute(
      'href',
      '/institutions/x/courses/1',
    );

    await user.click(screen.getByRole('button', { name: 'algo' }));
    expect(screen.getByLabelText('What are you looking for?')).toHaveValue('algo');
  });

  it('forgets the history on request', async () => {
    useRecentSearchStore.getState().remember(INSTITUTION, 'algo', {
      key: 'offering-1',
      title: 'Algorithms',
      subtitle: null,
      context: null,
      href: '/x',
    });

    const { user } = render();
    await user.click(await screen.findByRole('button', { name: 'Clear history' }));

    expect(
      screen.queryByRole('heading', { name: 'Recent searches' }),
    ).not.toBeInTheDocument();
  });

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

    expect(headings).toEqual(['Course pages', 'Courses', 'Rooms']);
  });

  it('links a hit somewhere it can actually be opened', async () => {
    render();
    await type('algorithms');

    const onOffer = await screen.findByRole('heading', { name: 'Course pages' });
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

  it('finds a teacher and opens their profile', async () => {
    server.use(
      http.get(SEARCH, () =>
        HttpResponse.json({
          ...searchResults,
          searched: ['course', 'offering', 'program', 'teacher', 'room'],
          hits: [
            {
              kind: 'teacher',
              id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
              title: 'Peter Novák',
              subtitle: 'peter.novak@ukf.sk',
              context: null,
              offeringId: null,
              programId: null,
            },
          ],
        }),
      ),
    );

    render();
    await type('peter');

    const teachers = await screen.findByRole('heading', { name: 'Teachers' });
    expect(teachers).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Peter Novák/ })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/teachers/dddddddd-dddd-4ddd-8ddd-ddddddddddd1`,
    );
  });

  it('does not call people unsearched when the reader searched their teachers', async () => {
    server.use(
      http.get(SEARCH, () =>
        HttpResponse.json({
          ...searchResults,
          searched: ['course', 'offering', 'program', 'teacher', 'room'],
        }),
      ),
    );

    render();
    await type('algorithms');

    expect(
      await screen.findByText(/Not searched, because your role/),
    ).toBeInTheDocument();
    expect(screen.getByText('Org units')).toBeInTheDocument();
    expect(screen.queryByText('People')).not.toBeInTheDocument();
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
