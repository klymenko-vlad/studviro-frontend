'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import {
  groupTeachingByTerm,
  teachingOfferingQueries,
  totalEnrolled,
  type TermTeachingOfferings,
} from '@/entities/teaching-offering';
import { institutionRoutes, Link } from '@/shared/config';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ListSkeleton,
  QueryError,
} from '@/shared/ui';

import { currentOrNextTerm } from '../model/current-term';
import { useTileHeading } from './tile-heading';

const SHOWN = 5;

function termToShow(groups: TermTeachingOfferings[], now: Date) {
  const term = currentOrNextTerm(
    groups.map(group => group.term),
    now,
  );

  return groups.find(group => group.term.id === term?.id) ?? groups[0];
}

export function TeachingTile({
  institutionId,
  now: initialNow,
}: {
  institutionId: string;
  now?: Date;
}) {
  const t = useTranslations('dashboard');
  const heading = useTileHeading();
  const tTeaching = useTranslations('myTeaching');
  const format = useFormatter();
  const [now] = useState(() => initialNow ?? new Date());
  const routes = institutionRoutes(institutionId);
  const { data, isPending, isError, refetch } = useQuery(
    teachingOfferingQueries.list({ path: { institutionId } }),
  );

  const group =
    isPending || isError ? undefined : termToShow(groupTeachingByTerm(data), now);

  return (
    <Card>
      <CardHeader>
        <CardTitle as={heading}>{t('teaching.title')}</CardTitle>
        <CardDescription>
          {group === undefined
            ? t('teaching.description')
            : t('teaching.term', {
                term: group.term.name,
                starts: format.dateTime(new Date(group.term.startsAt), {
                  dateStyle: 'medium',
                }),
              })}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {isPending ? (
          <ListSkeleton items={3} data-testid="dashboard-teaching-loading" />
        ) : isError ? (
          <QueryError title={t('teaching.error')} onRetry={refetch} />
        ) : group === undefined ? (
          <EmptyState size="inline" title={t('teaching.empty')} />
        ) : (
          <>
            <p className="text-sm" data-testid="dashboard-teaching-summary">
              {t('teaching.summary', {
                offerings: group.offerings.length,
                students: totalEnrolled(group.offerings),
              })}
            </p>

            <ul className="-mx-2 flex flex-col">
              {group.offerings.slice(0, SHOWN).map(offering => (
                <li key={offering.assignmentId}>
                  <Link
                    href={routes.courseOffering(offering.offering.id)}
                    className="group hover:bg-secondary/60 focus-visible:ring-ring/50 flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors outline-none focus-visible:ring-[3px]"
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">
                        {offering.course.title}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">
                        {offering.course.code} · {tTeaching(`role.${offering.role}`)}
                      </span>
                    </span>
                    <span className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                      {t('teaching.students', { count: offering.enrolledCount })}
                    </span>
                    <ChevronRight
                      aria-hidden
                      className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    />
                  </Link>
                </li>
              ))}
            </ul>

            {group.offerings.length > SHOWN ? (
              <p className="text-muted-foreground text-xs">
                {t('courses.more', { count: group.offerings.length - SHOWN })}
              </p>
            ) : null}
          </>
        )}

        <Button asChild variant="outline" size="sm" className="self-start">
          <Link href={routes.teaching}>{t('teaching.link')}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
