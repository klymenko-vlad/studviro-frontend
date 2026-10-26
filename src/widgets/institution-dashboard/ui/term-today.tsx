'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';

import { academicTermQueries } from '@/entities/academic-term';

import { currentOrNextTerm, termWeek } from '../model/current-term';

export function TermToday({
  institutionId,
  now: initialNow,
}: {
  institutionId: string;
  now?: Date;
}) {
  const t = useTranslations('dashboard.today');
  const format = useFormatter();
  const [now] = useState(() => initialNow ?? new Date());
  const { data } = useQuery(academicTermQueries.list({ path: { institutionId } }));

  const term = data === undefined ? null : currentOrNextTerm(data, now);
  const today = format.dateTime(now, { weekday: 'long', month: 'long', day: 'numeric' });
  const where =
    term === null
      ? null
      : new Date(term.startsAt) <= now
        ? t('week', { ...termWeek(term, now), term: term.name })
        : t('starts', {
            term: term.name,
            date: format.dateTime(new Date(term.startsAt), { dateStyle: 'medium' }),
          });

  return (
    <p className="text-muted-foreground text-sm">
      {where === null ? today : `${today} · ${where}`}
    </p>
  );
}
