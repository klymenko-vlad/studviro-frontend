import { beforeEach, describe, expect, it } from 'vitest';

import {
  RECENT_LIMIT,
  useRecentSearchStore,
  type OpenedHit,
} from './recent-search-store';

const INSTITUTION = 'inst-1';
const store = () => useRecentSearchStore.getState();

const hit = (id: string): OpenedHit => ({
  key: `offering-${id}`,
  title: `Course ${id}`,
  subtitle: id,
  context: null,
  href: `/courses/${id}`,
});

describe('recent searches', () => {
  beforeEach(() => {
    useRecentSearchStore.setState({ byInstitution: {} });
  });

  it('remembers what was opened, newest first, with the query that found it', () => {
    store().remember(INSTITUTION, 'algo', hit('1'));
    store().remember(INSTITUTION, 'data', hit('2'));

    expect(store().queriesFor(INSTITUTION)).toEqual(['data', 'algo']);
    expect(
      store()
        .openedFor(INSTITUTION)
        .map(item => item.key),
    ).toEqual(['offering-2', 'offering-1']);
  });

  it('keeps one entry per query and per result, moved to the top when repeated', () => {
    store().remember(INSTITUTION, 'algo', hit('1'));
    store().remember(INSTITUTION, 'data', hit('2'));
    store().remember(INSTITUTION, 'Algo ', hit('1'));

    expect(store().queriesFor(INSTITUTION)).toEqual(['Algo', 'data']);
    expect(store().openedFor(INSTITUTION)[0]?.key).toBe('offering-1');
    expect(store().openedFor(INSTITUTION)).toHaveLength(2);
  });

  it('keeps only the last few', () => {
    for (let index = 0; index < RECENT_LIMIT + 3; index += 1) {
      store().remember(INSTITUTION, `query ${String(index)}`, hit(String(index)));
    }

    expect(store().queriesFor(INSTITUTION)).toHaveLength(RECENT_LIMIT);
    expect(store().openedFor(INSTITUTION)).toHaveLength(RECENT_LIMIT);
  });

  it('keeps each institution’s history to itself', () => {
    store().remember(INSTITUTION, 'algo', hit('1'));

    expect(store().queriesFor('inst-2')).toEqual([]);
  });

  it('forgets on request', () => {
    store().remember(INSTITUTION, 'algo', hit('1'));
    store().forget(INSTITUTION);

    expect(store().queriesFor(INSTITUTION)).toEqual([]);
    expect(store().openedFor(INSTITUTION)).toEqual([]);
  });
});
