'use client';

import { useId, useState, useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Clock, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { courseOfferingHref } from '@/entities/course-offering';
import { enrolledCourseQueries, groupByTerm } from '@/entities/enrolled-course';
import { usePermissions } from '@/entities/permission';
import {
  byKind,
  hrefFor,
  MIN_QUERY,
  searchQueries,
  type SearchHitKind,
} from '@/entities/search';
import {
  groupTeachingByTerm,
  teachingOfferingQueries,
} from '@/entities/teaching-offering';
import {
  institutionRoutes,
  Link,
  usePathname,
  useRouter,
  useSearchParams,
} from '@/shared/config';
import { Badge, Button, Input, Label, LinkRow } from '@/shared/ui';

import { useRecentSearchStore, type OpenedHit } from '../model/recent-search-store';

const SUGGESTED = 5;
const NAMED_WHEN_UNSEARCHED = [
  'course',
  'offering',
  'program',
  'person',
  'orgUnit',
  'room',
] as const;
const NONE: string[] = [];
const NO_HITS: OpenedHit[] = [];
const subscribeNothing = () => () => undefined;
const browserSnapshot = () => true;
const serverSnapshot = () => false;

/**
 * One box over everything the caller may see.
 *
 * The server decides what is searched from the caller's permissions and
 * reports which kinds it looked at, so this renders that honestly: a kind
 * that was never searched is named rather than silently absent, because an
 * empty result and a result the caller was not allowed to have are different
 * answers and a student should not have to guess which they got.
 *
 * Before anything is typed the box is not a blank: it offers the person's own
 * courses, what they searched for lately and what they opened. The query lives
 * in `?q=`, so a search can be linked to and survives Back.
 */
export function InstitutionSearch({ institutionId }: { institutionId: string }) {
  const t = useTranslations('search');
  const inputId = useId();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState(() => params.get('q') ?? '');
  const trimmed = query.trim();
  const routes = institutionRoutes(institutionId);
  const remember = useRecentSearchStore(state => state.remember);

  const change = (value: string) => {
    setQuery(value);
    const next = new URLSearchParams(params.toString());
    if (value.trim() === '') next.delete('q');
    else next.set('q', value);
    const search = next.toString();
    router.replace(search === '' ? pathname : `${pathname}?${search}`, { scroll: false });
  };

  const results = useQuery({
    ...searchQueries.find({ path: { institutionId }, query: { q: trimmed } }),
    enabled: trimmed.length >= MIN_QUERY,
  });

  const groups = results.data === undefined ? [] : byKind(results.data.hits);
  const notSearched =
    results.data === undefined ? [] : unsearchedKinds(results.data.searched);

  return (
    <section className="flex flex-col gap-6" aria-label={t('title')}>
      <div className="flex flex-col gap-1">
        <Label htmlFor={inputId}>{t('label')}</Label>
        <Input
          id={inputId}
          type="search"
          autoComplete="off"
          placeholder={t('placeholder')}
          value={query}
          onChange={event => {
            change(event.target.value);
          }}
        />
        <p className="text-muted-foreground text-xs">{t('hint')}</p>
      </div>

      {trimmed.length < MIN_QUERY ? (
        <StartingPoints institutionId={institutionId} onQuery={change} />
      ) : null}

      <div aria-live="polite" className="flex flex-col gap-6">
        {trimmed.length < MIN_QUERY ? null : results.isPending ? (
          <p className="text-muted-foreground text-sm">{t('searching')}</p>
        ) : results.isError ? (
          <p className="text-muted-foreground text-sm">{t('error')}</p>
        ) : groups.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t('nothing', { query: trimmed })}
          </p>
        ) : (
          groups.map(group => (
            <ResultGroup key={group.kind} title={t(`kind.${group.kind}`)}>
              {group.hits.map(hit => {
                const opened: OpenedHit = {
                  key: `${hit.kind}-${hit.id}`,
                  title: hit.title,
                  subtitle: hit.subtitle,
                  context: hit.context,
                  href: hrefFor(hit, routes),
                };

                return (
                  <ResultRow
                    key={opened.key}
                    hit={opened}
                    onOpen={() => {
                      remember(institutionId, trimmed, opened);
                    }}
                  />
                );
              })}
            </ResultGroup>
          ))
        )}

        {results.data?.truncated === true ? (
          <p className="text-muted-foreground text-sm">{t('truncated')}</p>
        ) : null}

        {notSearched.length === 0 ? null : (
          <p className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
            {t('notSearched')}
            {notSearched.map(kind => (
              <Badge key={kind} variant="outline">
                {t(`kind.${kind}`)}
              </Badge>
            ))}
          </p>
        )}
      </div>
    </section>
  );
}

function StartingPoints({
  institutionId,
  onQuery,
}: {
  institutionId: string;
  onQuery: (query: string) => void;
}) {
  const t = useTranslations('search');
  const { can } = usePermissions(institutionId);
  // History lives in this browser's storage, which the server cannot read: it
  // is shown only once the page runs here, so both renders agree.
  const inBrowser = useSyncExternalStore(
    subscribeNothing,
    browserSnapshot,
    serverSnapshot,
  );
  const storedQueries = useRecentSearchStore(state => state.queriesFor(institutionId));
  const storedOpened = useRecentSearchStore(state => state.openedFor(institutionId));
  const queries = inBrowser ? storedQueries : NONE;
  const opened = inBrowser ? storedOpened : NO_HITS;
  const forget = useRecentSearchStore(state => state.forget);

  const enrolled = useQuery({
    ...enrolledCourseQueries.list({ path: { institutionId } }),
    enabled: can('enrollment:read'),
  });
  const teaching = useQuery({
    ...teachingOfferingQueries.list({ path: { institutionId } }),
    enabled: can('grade:propose'),
  });

  const courses: OpenedHit[] = [
    ...(teaching.data === undefined
      ? []
      : (groupTeachingByTerm(teaching.data)[0]?.offerings ?? []).map(offering => ({
          key: `offering-${offering.offering.id}`,
          title: offering.course.title,
          subtitle: offering.course.code,
          context: offering.term.name,
          href: courseOfferingHref(institutionId, offering.offering.id),
        }))),
    ...(enrolled.data === undefined
      ? []
      : (groupByTerm(enrolled.data)[0]?.courses ?? [])
          .filter(course => course.status === 'active')
          .map(course => ({
            key: `offering-${course.offering.id}`,
            title: course.course.title,
            subtitle: course.course.code,
            context: course.term.name,
            href: courseOfferingHref(institutionId, course.offering.id),
          }))),
  ].slice(0, SUGGESTED);

  if (queries.length === 0 && opened.length === 0 && courses.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('tip')}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {queries.length === 0 ? null : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight">{t('recentQueries')}</h2>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                forget(institutionId);
              }}
            >
              <X aria-hidden />
              {t('clearRecent')}
            </Button>
          </div>
          <ul className="flex flex-wrap gap-2">
            {queries.map(query => (
              <li key={query}>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    onQuery(query);
                  }}
                >
                  <Clock aria-hidden className="text-muted-foreground" />
                  {query}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {opened.length === 0 ? null : (
        <ResultGroup title={t('recentlyOpened')}>
          {opened.map(hit => (
            <ResultRow key={hit.key} hit={hit} />
          ))}
        </ResultGroup>
      )}

      {courses.length === 0 ? null : (
        <ResultGroup title={t('yourCourses')}>
          {courses.map(hit => (
            <ResultRow key={hit.key} hit={hit} />
          ))}
        </ResultGroup>
      )}
    </div>
  );
}

function ResultGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      <ul className="stagger -mx-2 flex flex-col gap-0.5">{children}</ul>
    </div>
  );
}

function ResultRow({ hit, onOpen }: { hit: OpenedHit; onOpen?: () => void }) {
  return (
    <li>
      <LinkRow asChild>
        <Link href={hit.href} onClick={onOpen}>
          <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
            <span className="font-medium">{hit.title}</span>
            {hit.subtitle === null ? null : (
              <span className="text-muted-foreground font-mono text-xs">
                {hit.subtitle}
              </span>
            )}
            {hit.context === null ? null : (
              <span className="text-muted-foreground text-xs">{hit.context}</span>
            )}
          </span>
          <ArrowUpRight
            aria-hidden
            className="text-muted-foreground size-4 shrink-0 opacity-0 transition-[opacity,translate] duration-500 ease-(--ease-premium) group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 group-focus-visible:opacity-100"
          />
        </Link>
      </LinkRow>
    </li>
  );
}

/** A reader who searched teachers has searched the people they may find. */
function unsearchedKinds(searched: readonly SearchHitKind[]) {
  return NAMED_WHEN_UNSEARCHED.filter(
    kind =>
      !searched.includes(kind) && !(kind === 'person' && searched.includes('teacher')),
  );
}
