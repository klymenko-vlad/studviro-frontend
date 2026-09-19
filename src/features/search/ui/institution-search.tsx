'use client';

import { useId, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { byKind, hrefFor, MIN_QUERY, searchQueries } from '@/entities/search';
import { institutionRoutes, Link } from '@/shared/config';
import { Badge, Input, Label } from '@/shared/ui';

/**
 * One box over everything the caller may see.
 *
 * The server decides what is searched from the caller's permissions and
 * reports which kinds it looked at, so this renders that honestly: a kind
 * that was never searched is named rather than silently absent, because an
 * empty result and a result the caller was not allowed to have are different
 * answers and a student should not have to guess which they got.
 */
export function InstitutionSearch({ institutionId }: { institutionId: string }) {
  const t = useTranslations('search');
  const inputId = useId();
  const [query, setQuery] = useState('');
  const trimmed = query.trim();
  const routes = institutionRoutes(institutionId);

  const results = useQuery({
    ...searchQueries.find({ path: { institutionId }, query: { q: trimmed } }),
    enabled: trimmed.length >= MIN_QUERY,
  });

  const groups = results.data === undefined ? [] : byKind(results.data.hits);
  const notSearched =
    results.data === undefined
      ? []
      : (['course', 'offering', 'program', 'person', 'orgUnit', 'room'] as const).filter(
          kind => !results.data.searched.includes(kind),
        );

  return (
    <section className="flex flex-col gap-4" aria-label={t('title')}>
      <div className="flex flex-col gap-1">
        <Label htmlFor={inputId}>{t('label')}</Label>
        <Input
          id={inputId}
          type="search"
          autoComplete="off"
          placeholder={t('placeholder')}
          value={query}
          onChange={event => {
            setQuery(event.target.value);
          }}
        />
        <p className="text-muted-foreground text-xs">{t('hint')}</p>
      </div>

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
            <div key={group.kind} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold tracking-tight">
                {t(`kind.${group.kind}`)}
              </h2>
              <ul className="flex flex-col gap-1">
                {group.hits.map(hit => (
                  <li key={`${hit.kind}-${hit.id}`}>
                    <Link
                      href={hrefFor(hit, routes)}
                      className="hover:bg-muted flex flex-wrap items-baseline gap-x-2 rounded-md px-2 py-1.5 focus-visible:underline"
                    >
                      <span className="font-medium">{hit.title}</span>
                      {hit.subtitle === null ? null : (
                        <span className="text-muted-foreground font-mono text-xs">
                          {hit.subtitle}
                        </span>
                      )}
                      {hit.context === null ? null : (
                        <span className="text-muted-foreground text-xs">
                          {hit.context}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
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
