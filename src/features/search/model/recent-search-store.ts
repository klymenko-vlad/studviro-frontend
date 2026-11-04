import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const RECENT_LIMIT = 5;

/** A result the person opened, kept as it looked so it can be shown without a query. */
export interface OpenedHit {
  key: string;
  title: string;
  subtitle: string | null;
  context: string | null;
  href: string;
}

interface History {
  queries: string[];
  opened: OpenedHit[];
}

interface RecentSearchState {
  byInstitution: Record<string, History>;
  remember: (institutionId: string, query: string, hit: OpenedHit) => void;
  forget: (institutionId: string) => void;
  queriesFor: (institutionId: string) => string[];
  openedFor: (institutionId: string) => OpenedHit[];
}

/** Shared, so a selector reading an empty history returns the same value every time. */
const EMPTY: History = { queries: [], opened: [] };

/**
 * What this browser searched for and opened, per institution. Recorded when a
 * result is followed rather than on every keystroke, so the list holds
 * searches that found something, not half-typed words. Local to the device:
 * it is the person's own trail and never leaves the browser.
 */
export const useRecentSearchStore = create<RecentSearchState>()(
  persist(
    (set, get) => ({
      byInstitution: {},
      remember: (institutionId, rawQuery, hit) => {
        const query = rawQuery.trim();
        const history = get().byInstitution[institutionId] ?? EMPTY;
        const sameQuery = (other: string) => other.toLowerCase() === query.toLowerCase();

        set({
          byInstitution: {
            ...get().byInstitution,
            [institutionId]: {
              queries: [
                query,
                ...history.queries.filter(other => !sameQuery(other)),
              ].slice(0, RECENT_LIMIT),
              opened: [
                hit,
                ...history.opened.filter(other => other.key !== hit.key),
              ].slice(0, RECENT_LIMIT),
            },
          },
        });
      },
      forget: institutionId => {
        set({
          byInstitution: Object.fromEntries(
            Object.entries(get().byInstitution).filter(([id]) => id !== institutionId),
          ),
        });
      },
      queriesFor: institutionId =>
        get().byInstitution[institutionId]?.queries ?? EMPTY.queries,
      openedFor: institutionId =>
        get().byInstitution[institutionId]?.opened ?? EMPTY.opened,
    }),
    {
      name: 'studviro.recent-search',
      partialize: state => ({ byInstitution: state.byInstitution }),
    },
  ),
);
