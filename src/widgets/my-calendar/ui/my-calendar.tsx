'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTimeZone, useTranslations } from 'next-intl';

import {
  ALL_COURSES,
  ChoiceFilter,
  CourseFilter,
  courseFilterOptions,
  offeringFilterValue,
  ScheduleFilters,
  ToggleFilter,
} from '@/features/filter-schedule';
import { deadlineQueries } from '@/entities/deadline';
import { examTermQueries } from '@/entities/exam-term';
import {
  addDays,
  addWeeks,
  startOfWeek,
  timetableEventQueries,
  type TimetableEventType,
} from '@/entities/timetable-event';
import { Button, EmptyState, ListSkeleton, QueryError } from '@/shared/ui';

import { groupCalendarItems } from '../model/calendar-items';
import { CalendarDaySection } from './calendar-day-section';

const ALL_TYPES = 'all';
const TYPES: TimetableEventType[] = [
  'lecture',
  'seminar',
  'lab',
  'consultation',
  'exam',
  'other',
];

export function MyCalendar({
  institutionId,
  today = new Date(),
}: {
  institutionId: string;
  today?: Date;
}) {
  const t = useTranslations('calendar');
  const format = useFormatter();
  const timeZone = useTimeZone() ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [from, setFrom] = useState(() => startOfWeek(today));
  const [offering, setOffering] = useState<string>(ALL_COURSES);
  const [type, setType] = useState<string>(ALL_TYPES);
  const [showExams, setShowExams] = useState(true);
  const [showDeadlines, setShowDeadlines] = useState(true);
  const to = addWeeks(from, 1);

  const range = { from: from.toISOString(), to: to.toISOString() };
  const offeringId = offeringFilterValue(offering);

  const { data, isPending, isError, refetch } = useQuery(
    timetableEventQueries.list({
      path: { institutionId },
      query: {
        ...range,
        offeringId,
        type: type === ALL_TYPES ? undefined : (type as TimetableEventType),
      },
    }),
  );

  const exams = useQuery({
    ...examTermQueries.list({ path: { institutionId }, query: { ...range, offeringId } }),
    enabled: showExams,
  });

  const deadlines = useQuery({
    ...deadlineQueries.list({ path: { institutionId }, query: { ...range, offeringId } }),
    enabled: showDeadlines,
  });

  const courses = useQuery({
    ...timetableEventQueries.list({ path: { institutionId }, query: range }),
    select: courseFilterOptions,
  });

  const day = { day: 'numeric', month: 'short' } as const;
  const lastDay = addDays(from, 6);
  const days = groupCalendarItems(
    data ?? [],
    showExams ? (exams.data ?? []) : [],
    showDeadlines ? (deadlines.data ?? []) : [],
    timeZone,
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="font-medium" data-testid="calendar-week">
            {t('week', {
              from: format.dateTime(from, day),
              to: format.dateTime(lastDay, day),
            })}
          </p>
          {isPending || isError ? null : (
            <p className="text-muted-foreground text-sm">
              {t('weekSummary', { events: days.reduce((n, d) => n + d.items.length, 0) })}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFrom(addWeeks(from, -1));
            }}
          >
            {t('previousWeek')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFrom(startOfWeek(today));
            }}
          >
            {t('thisWeek')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFrom(addWeeks(from, 1));
            }}
          >
            {t('nextWeek')}
          </Button>
        </div>
      </div>

      <ScheduleFilters label={t('filters')}>
        <CourseFilter
          label={t('filterCourse')}
          allLabel={t('allCourses')}
          options={courses.data ?? []}
          value={offering}
          onChange={setOffering}
        />
        <ChoiceFilter
          label={t('filterType')}
          allLabel={t('allTypes')}
          allValue={ALL_TYPES}
          options={TYPES.map(value => ({ value, label: t(`type.${value}`) }))}
          value={type}
          onChange={setType}
        />
        <ToggleFilter
          label={t('showExams')}
          checked={showExams}
          onChange={setShowExams}
        />
        <ToggleFilter
          label={t('showDeadlines')}
          checked={showDeadlines}
          onChange={setShowDeadlines}
        />
      </ScheduleFilters>

      {isPending ? (
        <ListSkeleton items={3} data-testid="my-calendar-loading" />
      ) : isError ? (
        <QueryError
          onRetry={refetch}
          title={t('errorTitle')}
          description={t('errorDescription')}
        />
      ) : days.length === 0 ? (
        <EmptyState size="inline" title={t('empty')} />
      ) : (
        days.map(entry => (
          <CalendarDaySection
            key={entry.key}
            day={entry}
            institutionId={institutionId}
            today={today}
            timeZone={timeZone}
          />
        ))
      )}
    </div>
  );
}
